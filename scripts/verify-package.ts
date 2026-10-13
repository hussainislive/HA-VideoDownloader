import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, readdir, readFile, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { BUNDLED_MAC_RUNTIME_VERSION } from '../src/main/engine/mac-runtime-release'

type MacArchitecture = 'arm64' | 'x64'

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function run(file: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, [...args], {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')))
    child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')))
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve(output.trim())
      else reject(new Error(`${file} ${args.join(' ')} failed: ${output.trim()}`))
    })
  })
}

async function assertExecutable(path: string): Promise<void> {
  const details = await stat(path)
  if (!details.isFile() || (details.mode & 0o111) === 0)
    throw new Error(`${path} is missing or not executable`)
  await access(path, constants.R_OK | constants.X_OK)
}

async function assertArchitecture(
  path: string,
  architecture: MacArchitecture,
  allowUniversal: boolean,
): Promise<string> {
  const output = await run('lipo', ['-info', path])
  const required = architecture === 'x64' ? 'x86_64' : 'arm64'
  if (!output.includes(required)) throw new Error(`${path} does not contain ${required}: ${output}`)
  const forbidden = architecture === 'x64' ? 'arm64' : 'x86_64'
  if (!allowUniversal && output.includes(forbidden))
    throw new Error(`${path} contains the wrong ${forbidden} architecture: ${output}`)
  return output
}

async function main(): Promise<void> {
  if (process.platform !== 'darwin')
    throw new Error('macOS package verification requires lipo and codesign on macOS')
  const appPath = argument('--app')
  const architecture = argument('--arch')
  if (!appPath || (architecture !== 'x64' && architecture !== 'arm64'))
    throw new Error('Usage: verify-package.ts --app <path.app> --arch <x64|arm64>')

  const resources = join(appPath, 'Contents', 'Resources')
  const binaryRoot = join(resources, 'binaries')
  const expectedFolder = `macos-${architecture}`
  const folders = (await readdir(binaryRoot)).filter((name) => name.startsWith('macos-'))
  if (folders.length !== 1 || folders[0] !== expectedFolder)
    throw new Error(`Expected only ${expectedFolder}; found ${folders.join(', ') || 'none'}`)

  const ffmpeg = join(binaryRoot, expectedFolder, 'ffmpeg')
  const ytdlp = join(binaryRoot, expectedFolder, 'yt-dlp')
  const fastRuntime = join(resources, 'mac-runtime', expectedFolder)
  const fastYtdlp = join(fastRuntime, 'yt-dlp_macos')
  const fastPython = join(fastRuntime, '_internal', 'Python')
  const executable = join(appPath, 'Contents', 'MacOS', basename(appPath, '.app'))
  await Promise.all([
    assertExecutable(ffmpeg),
    assertExecutable(ytdlp),
    assertExecutable(fastYtdlp),
    assertExecutable(fastPython),
    assertExecutable(executable),
  ])
  const [ffmpegArch, ytdlpArch, fastArch, pythonArch, appArch] = await Promise.all([
    assertArchitecture(ffmpeg, architecture, false),
    assertArchitecture(ytdlp, architecture, true),
    assertArchitecture(fastYtdlp, architecture, true),
    assertArchitecture(fastPython, architecture, true),
    assertArchitecture(executable, architecture, false),
    run('codesign', ['-dv', ffmpeg]),
    run('codesign', ['-dv', ytdlp]),
    run('codesign', ['-v', fastYtdlp]),
    run('codesign', ['-v', fastPython]),
    access(join(fastRuntime, '_internal', 'THIRD_PARTY_LICENSES.txt'), constants.R_OK),
    access(join(resources, 'licenses', 'LICENSE'), constants.R_OK),
    access(join(resources, 'licenses', 'THIRD_PARTY_NOTICES.md'), constants.R_OK),
    access(join(resources, 'icon.png'), constants.R_OK),
  ])
  const runtimeVersion = (await readFile(join(fastRuntime, '.ha-version'), 'utf8')).trim()
  if (runtimeVersion !== BUNDLED_MAC_RUNTIME_VERSION)
    throw new Error(`Expected macOS yt-dlp ${BUNDLED_MAC_RUNTIME_VERSION}, found ${runtimeVersion}`)
  process.stdout.write(
    [
      `Package: ${appPath}`,
      `App: ${appArch}`,
      `FFmpeg: ${ffmpegArch}`,
      `yt-dlp: ${ytdlpArch}`,
      `Fast yt-dlp: ${fastArch}`,
      `Fast Python: ${pythonArch}`,
    ].join('\n') + '\n',
  )
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Package verification failed'}\n`,
  )
  process.exitCode = 1
})
