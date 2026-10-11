import { constants } from 'node:fs'
import { access, chmod, copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { EngineStatus } from '@shared/types/engine'
import { app } from 'electron'

import { logger } from '../logger'
import { ProcessRunner } from './process-runner'

export interface EnginePaths {
  ytdlp: string
  ffmpeg: string
  testScript?: string
}

function existingOverride(name: 'HA_YTDLP_PATH' | 'HA_FFMPEG_PATH'): string | undefined {
  return app.isPackaged ? undefined : process.env[name]
}

async function exists(path: string): Promise<boolean> {
  return access(path, constants.X_OK).then(
    () => true,
    () => false,
  )
}

async function resourcesRoot(): Promise<string> {
  if (app.isPackaged) return process.resourcesPath
  const appRoot = app.getAppPath()
  const candidates = [appRoot, join(appRoot, '..', '..'), process.cwd()]
  for (const candidate of new Set(candidates)) {
    const root = join(candidate, 'binaries')
    if (await exists(root)) return root
  }
  return join(appRoot, 'binaries')
}

function firstVersionLine(output: string): string | undefined {
  return output
    .split(/\r?\n/u)
    .find((line) => line.trim().length > 0)
    ?.trim()
}

export class BinaryService {
  readonly #runner: ProcessRunner
  #paths?: EnginePaths
  #resolvedYtdlpVersion: string | undefined
  #status?: EngineStatus
  #statusError?: EngineStatus['error']

  constructor(runner = new ProcessRunner()) {
    this.#runner = runner
  }

  async initialize(): Promise<EngineStatus> {
    const paths = await this.#resolvePaths()
    this.#paths = paths
    const resolvedYtdlpVersion = this.#resolvedYtdlpVersion
    this.#resolvedYtdlpVersion = undefined
    const [ytdlpVersion, ffmpegVersion, ytdlpFound, ffmpegFound] = await Promise.all([
      resolvedYtdlpVersion ? Promise.resolve(resolvedYtdlpVersion) : this.#probeYtdlp(),
      this.#probeVersion(paths.ffmpeg, ['-version']),
      paths.testScript ? Promise.resolve(true) : exists(paths.ytdlp),
      exists(paths.ffmpeg),
    ])
    this.#status = {
      ytdlp: this.#binaryStatus(paths.ytdlp, ytdlpFound, ytdlpVersion),
      ffmpeg: this.#binaryStatus(paths.ffmpeg, ffmpegFound, ffmpegVersion),
      arch: process.arch,
      ok: ytdlpVersion !== undefined && ffmpegVersion !== undefined,
      ...(this.#statusError ? { error: this.#statusError } : {}),
    }
    return this.#status
  }

  async #resolvePaths(): Promise<EnginePaths> {
    this.#resolvedYtdlpVersion = undefined
    const binaryRoot = await resourcesRoot()
    const platformFolder = process.platform === 'win32' ? 'win' : 'macos'
    const suffix = process.platform === 'win32' ? '.exe' : ''
    const bundledYtdlp = join(binaryRoot, platformFolder, `yt-dlp${suffix}`)
    const bundledFfmpeg = join(binaryRoot, platformFolder, `ffmpeg${suffix}`)
    const engineDir = join(app.getPath('userData'), 'engine')
    const installedYtdlp = join(engineDir, `yt-dlp${suffix}`)
    const ytdlpOverride = existingOverride('HA_YTDLP_PATH')
    const ffmpegOverride = existingOverride('HA_FFMPEG_PATH')
    const testScript = app.isPackaged ? undefined : process.env.HA_TEST_ENGINE_SCRIPT

    await mkdir(engineDir, { recursive: true })
    if (!ytdlpOverride && !testScript)
      this.#resolvedYtdlpVersion = await this.#installWritableCopy(bundledYtdlp, installedYtdlp)
    return {
      ytdlp: ytdlpOverride ?? (testScript ? process.execPath : installedYtdlp),
      ffmpeg: ffmpegOverride ?? bundledFfmpeg,
      ...(testScript ? { testScript } : {}),
    }
  }

  #binaryStatus(path: string, found: boolean, version?: string): EngineStatus['ytdlp'] {
    return { found: found && version !== undefined, path, ...(version ? { version } : {}) }
  }

  get paths(): EnginePaths {
    if (!this.#paths) throw new Error('Binary service is not initialized')
    return this.#paths
  }

  get status(): EngineStatus {
    if (!this.#status) throw new Error('Binary service is not initialized')
    return this.#status
  }

  ytdlpInvocation(args: readonly string[]): {
    file: string
    args: string[]
    env?: NodeJS.ProcessEnv
  } {
    const paths = this.paths
    if (!paths.testScript) return { file: paths.ytdlp, args: [...args] }
    return {
      file: process.execPath,
      args: [paths.testScript, ...args],
      env: { ELECTRON_RUN_AS_NODE: '1' },
    }
  }

  async refreshStatus(): Promise<EngineStatus> {
    return this.initialize()
  }

  async restoreBundledCopy(): Promise<void> {
    const binaryRoot = await resourcesRoot()
    const platformFolder = process.platform === 'win32' ? 'win' : 'macos'
    const suffix = process.platform === 'win32' ? '.exe' : ''
    await this.#copyExecutable(
      join(binaryRoot, platformFolder, `yt-dlp${suffix}`),
      join(app.getPath('userData'), 'engine', `yt-dlp${suffix}`),
    )
  }

  async #installWritableCopy(source: string, destination: string): Promise<string | undefined> {
    if (!(await exists(destination))) {
      await this.#copyExecutable(source, destination)
      return undefined
    }
    const [bundledVersion, installedVersion] = await Promise.all([
      this.#probeVersion(source, ['--version'], undefined, 45_000),
      this.#probeVersion(destination, ['--version'], undefined, 45_000),
    ])
    if (!installedVersion || (bundledVersion && bundledVersion > installedVersion)) {
      await this.#copyExecutable(source, destination)
      return bundledVersion
    }
    return installedVersion
  }

  async #copyExecutable(source: string, destination: string): Promise<void> {
    await copyFile(source, destination)
    if (process.platform !== 'win32') {
      await chmod(destination, 0o755)
      await this.#runner
        .run('xattr', ['-d', 'com.apple.quarantine', destination])
        .catch(() => undefined)
    }
  }

  async #probeYtdlp(): Promise<string | undefined> {
    this.#statusError = undefined
    const invocation = this.ytdlpInvocation(['--version'])
    const version = await this.#probeVersion(
      invocation.file,
      invocation.args,
      invocation.env,
      45_000,
    )
    if (version || process.platform !== 'darwin' || this.paths.testScript || !this.#statusError)
      return version
    await this.#runner
      .run('codesign', ['--force', '--sign', '-', this.paths.ytdlp], { timeoutMs: 10_000 })
      .catch(() => undefined)
    this.#statusError = undefined
    return this.#probeVersion(invocation.file, invocation.args, invocation.env, 45_000)
  }

  async #probeVersion(
    file: string,
    args: readonly string[],
    env?: NodeJS.ProcessEnv,
    timeoutMs = 10_000,
  ): Promise<string | undefined> {
    try {
      const result = await this.#runner.run(file, args, {
        timeoutMs,
        ...(env ? { env } : {}),
      })
      if (result.code === 0) return firstVersionLine(result.stdout || result.stderr)
      if (process.platform === 'darwin' && /code signature|bad cpu type/iu.test(result.stderr)) {
        logger.warn('Engine executable needs platform repair', result.stderr)
        this.#statusError = /bad cpu type/iu.test(result.stderr)
          ? {
              code: 'ENGINE_BAD_ARCH',
              message: 'The download engine does not match this Mac architecture.',
              retryable: false,
              hint: 'Install Rosetta or use a build with matching binaries.',
            }
          : {
              code: 'ENGINE_NOT_FOUND',
              message: 'The download engine signature needs repair.',
              retryable: true,
            }
      }
    } catch (error) {
      logger.warn('Engine version probe failed', error)
    }
    return undefined
  }
}
