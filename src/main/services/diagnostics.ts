import { homedir, release, type } from 'node:os'
import { isAbsolute, join, relative } from 'node:path'

import type { EngineStatus } from '@shared/types/engine'

interface DiagnosticInput {
  appVersion: string
  engine: EngineStatus
  errorCodes: readonly string[]
}

function redactedPath(path: string): string {
  const home = homedir()
  if (path === home) return '~'
  const fromHome = relative(home, path)
  if (fromHome && !fromHome.startsWith('..') && !isAbsolute(fromHome)) return join('~', fromHome)
  return path
}

export function formatDiagnosticInfo(input: DiagnosticInput): string {
  const errors = [...new Set(input.errorCodes)].slice(-10)
  return [
    `HA Premium Video Downloader ${input.appVersion}`,
    `OS: ${type()} ${release()}`,
    `Architecture: ${process.arch}`,
    `yt-dlp: ${input.engine.ytdlp.version ?? 'unavailable'} (${redactedPath(input.engine.ytdlp.path)})`,
    `FFmpeg: ${input.engine.ffmpeg.version ?? 'unavailable'} (${redactedPath(input.engine.ffmpeg.path)})`,
    `Engine ready: ${input.engine.ok ? 'yes' : 'no'}`,
    `Last error codes: ${errors.length > 0 ? errors.join(', ') : 'none'}`,
  ].join('\n')
}
