import { join } from 'node:path'

import { app } from 'electron'

import { isAccessible, packagedBinaryRoot } from './binary-resolver'

export function existingOverride(name: 'HA_YTDLP_PATH' | 'HA_FFMPEG_PATH'): string | undefined {
  return app.isPackaged ? undefined : process.env[name]
}

export async function exists(
  path: string,
  executable = process.platform !== 'win32',
): Promise<boolean> {
  return isAccessible(path, executable)
}

export async function resourcesRoot(): Promise<string> {
  if (app.isPackaged) return packagedBinaryRoot(process.resourcesPath)
  const appRoot = app.getAppPath()
  const candidates = [appRoot, join(appRoot, '..', '..'), process.cwd()]
  for (const candidate of new Set(candidates)) {
    const root = join(candidate, 'binaries')
    if (await exists(root, false)) return root
  }
  return join(appRoot, 'binaries')
}

export function firstVersionLine(output: string): string | undefined {
  return output
    .split(/\r?\n/u)
    .find((line) => line.trim().length > 0)
    ?.trim()
}
