import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'

import { isAccessible } from './binary-resolver'
import {
  BUNDLED_MAC_RUNTIME_VERSION,
  installMacRuntimeArchive,
  latestMacRuntimeVersion,
} from './mac-runtime-release'

const VERSION_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/u

export function bundledMacRuntimePath(resourcesPath: string, arch: string): string {
  return join(resourcesPath, 'mac-runtime', `macos-${arch}`)
}

export function developmentMacRuntimePath(projectRoot: string): string {
  return join(projectRoot, '.cache', 'mac-runtime', BUNDLED_MAC_RUNTIME_VERSION)
}

function executablePath(runtime: string): string {
  return join(runtime, 'yt-dlp_macos')
}

async function validRuntime(runtime: string, version: string): Promise<boolean> {
  try {
    return (
      (await readFile(join(runtime, '.ha-version'), 'utf8')).trim() === version &&
      (await isAccessible(executablePath(runtime)))
    )
  } catch {
    return false
  }
}

export class MacRuntime {
  readonly #parent: string

  constructor(userData: string) {
    this.#parent = join(userData, 'engine', 'mac-runtime')
  }

  async prepare(bundledRuntime: string): Promise<string> {
    await mkdir(this.#parent, { recursive: true })
    const version = (await readFile(join(bundledRuntime, '.ha-version'), 'utf8')).trim()
    if (!VERSION_PATTERN.test(version)) throw new Error('Bundled yt-dlp runtime version is invalid')
    const destination = join(this.#parent, version)
    if (!(await validRuntime(destination, version))) {
      const temporary = await mkdtemp(join(this.#parent, '.copy-'))
      try {
        await cp(bundledRuntime, temporary, { recursive: true, force: true })
        if (!(await validRuntime(temporary, version)))
          throw new Error('The writable yt-dlp runtime copy is incomplete')
        await rm(destination, { recursive: true, force: true })
        await rename(temporary, destination)
      } finally {
        await rm(temporary, { recursive: true, force: true })
      }
    }
    return this.currentExecutable(version)
  }

  async currentExecutable(minimumVersion: string): Promise<string> {
    const versions = (await readdir(this.#parent))
      .filter((name) => VERSION_PATTERN.test(name) && name >= minimumVersion)
      .sort()
      .reverse()
    for (const version of versions) {
      const runtime = join(this.#parent, version)
      if (await validRuntime(runtime, version)) return executablePath(runtime)
    }
    throw new Error('No usable writable yt-dlp runtime was found')
  }

  async update(currentVersion: string): Promise<string> {
    const latest = await latestMacRuntimeVersion()
    if (latest <= currentVersion) return currentVersion
    await installMacRuntimeArchive(latest, this.#parent)
    return latest
  }
}
