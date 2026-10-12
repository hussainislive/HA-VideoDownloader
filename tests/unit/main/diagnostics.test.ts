import { homedir } from 'node:os'
import { join } from 'node:path'

import { formatDiagnosticInfo } from '@main/services/diagnostics'
import { describe, expect, it } from 'vitest'

describe('diagnostic information', () => {
  it('includes versions and error codes while redacting the user home path', () => {
    const report = formatDiagnosticInfo({
      appVersion: '1.0.0',
      engine: {
        ytdlp: { found: true, version: '2026.08.19', path: join(homedir(), 'engine', 'yt-dlp') },
        ffmpeg: { found: true, version: '9.0.2', path: '/Applications/App/ffmpeg' },
        arch: process.arch,
        ok: true,
      },
      errorCodes: ['NETWORK_OFFLINE', 'NETWORK_OFFLINE', 'DISK_FULL'],
    })

    expect(report).toContain('HA Premium Video Downloader 1.0.0')
    expect(report).toContain('2026.08.19')
    expect(report).toContain('NETWORK_OFFLINE, DISK_FULL')
    expect(report).toContain(join('~', 'engine', 'yt-dlp'))
    expect(report).not.toContain(homedir())
  })
})
