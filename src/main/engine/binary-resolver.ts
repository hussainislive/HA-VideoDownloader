import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

import type { Result } from '@shared/types/result'

export interface BundledBinaryPaths {
  ffmpeg: string
  folder: string
  ytdlp: string
}

export async function isAccessible(
  path: string,
  executable = process.platform !== 'win32',
): Promise<boolean> {
  const mode = executable ? constants.R_OK | constants.X_OK : constants.R_OK
  return access(path, mode).then(
    () => true,
    () => false,
  )
}

export function binaryFolderFor(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
): string | undefined {
  if (platform === 'darwin' && (arch === 'x64' || arch === 'arm64')) return `macos-${arch}`
  if (platform === 'win32' && arch === 'x64') return 'win'
  return undefined
}

export function bundledBinaryPaths(
  binaryRoot: string,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
): BundledBinaryPaths | undefined {
  const folder = binaryFolderFor(platform, arch)
  if (!folder) return undefined
  const suffix = platform === 'win32' ? '.exe' : ''
  return {
    folder,
    ytdlp: join(binaryRoot, folder, `yt-dlp${suffix}`),
    ffmpeg: join(binaryRoot, folder, `ffmpeg${suffix}`),
  }
}

export async function missingBundledBinaries(
  paths: BundledBinaryPaths,
  pathExists: (path: string) => Promise<boolean> = (path) => isAccessible(path),
): Promise<string[]> {
  const checks = await Promise.all([pathExists(paths.ytdlp), pathExists(paths.ffmpeg)])
  return [paths.ytdlp, paths.ffmpeg].filter((_, index) => !checks[index])
}

export async function resolveBundledBinaryPaths(
  binaryRoot: string,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
  pathExists?: (path: string) => Promise<boolean>,
): Promise<Result<BundledBinaryPaths>> {
  const paths = bundledBinaryPaths(binaryRoot, platform, arch)
  if (!paths) {
    return {
      ok: false,
      error: {
        code: 'ENGINE_BAD_ARCH',
        message: `This app build does not support ${platform} ${arch}.`,
        retryable: false,
      },
    }
  }
  const missing = await missingBundledBinaries(paths, pathExists)
  if (missing.length === 0) return { ok: true, value: paths }
  const label = platform === 'darwin' ? `macOS ${arch}` : 'Windows x64'
  return {
    ok: false,
    error: {
      code: 'ENGINE_NOT_FOUND',
      message: `The bundled download engine for ${label} is missing. Reinstall the matching app build.`,
      detail: `Missing files: ${missing.map((path) => path.split(/[/\\]/u).at(-1)).join(', ')}`,
      retryable: false,
    },
  }
}
