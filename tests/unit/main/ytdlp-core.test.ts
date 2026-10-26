import { join } from 'node:path'

import { buildDownloadArgs } from '@main/engine/ytdlp/args'
import { mapEngineError } from '@main/engine/ytdlp/errors'
import { parseProbeJson } from '@main/engine/ytdlp/probe'
import {
  parseProgressLine,
  phaseFromOutput,
  ProgressAccumulator,
} from '@main/engine/ytdlp/progress'
import type { DownloadJob } from '@shared/types/download'
import { describe, expect, it } from 'vitest'

const job: DownloadJob = {
  id: '3f551c93-577d-46f8-9711-0f3bc5395c64',
  url: 'https://example.com/watch?v=token',
  mediaId: 'media-id',
  title: 'Example',
  platform: 'Example',
  options: {
    kind: 'video',
    quality: 1080,
    container: 'mp4',
    audioFormat: 'mp3',
    bitrate: 320,
    embedMetadata: true,
    videoFormatId: '137',
    audioFormatId: '140',
  },
  outputDir: '/tmp/downloads',
  state: 'queued',
  progress: { phase: 'queued' },
  createdAt: '2026-01-01T00:00:00.000Z',
  attempt: 0,
  stallRetries: 0,
  usedContainerFallback: false,
  usedGenericFallback: false,
}

describe('yt-dlp pure contracts', () => {
  it('builds safe exact arguments and puts the URL after --', () => {
    const args = buildDownloadArgs(job, { ffmpegPath: '/engine/ffmpeg' })
    expect(args).toEqual([
      '--no-playlist',
      '--no-warnings',
      '--newline',
      '--no-colors',
      '--ignore-config',
      '--windows-filenames',
      '--trim-filenames',
      '180',
      '--no-mtime',
      '--continue',
      '--no-overwrites',
      '--concurrent-fragments',
      '4',
      '--retries',
      '5',
      '--fragment-retries',
      '5',
      '--socket-timeout',
      '20',
      '--ffmpeg-location',
      '/engine/ffmpeg',
      '-o',
      join('/tmp/downloads', '%(title).180B [%(id)s].%(ext)s'),
      '--progress',
      '--progress-template',
      'download:HA|%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s|%(progress.fragment_index)s|%(progress.fragment_count)s',
      '--print',
      'after_move:HAFILE|%(filepath)s',
      '--no-simulate',
      '-f',
      '137+140',
      '--merge-output-format',
      'mp4',
      '--embed-metadata',
      '--',
      job.url,
    ])
  })

  it('omits bitrate for WAV and uses the generic audio fallback', () => {
    const args = buildDownloadArgs(
      { ...job, options: { ...job.options, kind: 'audio', audioFormat: 'wav' } },
      { ffmpegPath: '/ffmpeg' },
    )
    expect(args).not.toContain('--audio-quality')
    expect(args).toContain('140')
  })

  it('builds the generic 8K selector from the requested quality', () => {
    const args = buildDownloadArgs(
      {
        ...job,
        options: {
          ...job.options,
          quality: 4320,
          videoFormatId: undefined,
          audioFormatId: undefined,
        },
      },
      { ffmpegPath: '/ffmpeg', forceGenericSelector: true },
    )
    const selectorIndex = args.indexOf('-f')
    expect(args[selectorIndex + 1]).toContain('height<=4320')
  })

  it('parses lenient probe data and rejects live streams', () => {
    const parsed = parseProbeJson(
      JSON.stringify({ id: '1', title: 'Clip', unknown: true, formats: [{ format_id: 'a' }] }),
      job.url,
    )
    expect(parsed.ok && parsed.value.title).toBe('Clip')
    expect(parseProbeJson(JSON.stringify({ id: '1', is_live: true }), job.url)).toMatchObject({
      ok: false,
      error: { code: 'LIVE_NOT_SUPPORTED' },
    })
  })

  it('parses progress and never moves aggregate percent backward', () => {
    const first = parseProgressLine('HA|downloading|50|100|NA|20|2|1|2')
    expect(first).toMatchObject({ percent: 50, speedBps: 20, etaSec: 2 })
    if (!first) throw new Error('Expected parsed progress')
    const accumulator = new ProgressAccumulator()
    expect(accumulator.update(first).percent).toBe(50)
    expect(
      accumulator.update({ phase: 'downloading', percent: 10, downloadedBytes: 10 }).percent,
    ).toBe(60)
    expect(phaseFromOutput('[Merger] Merging formats')).toBe('merging')
  })

  it.each([
    ['HTTP Error 403: Forbidden', 'HTTP_403_OR_BLOCKED'],
    ['Private video', 'VIDEO_UNAVAILABLE'],
    ['not available in your country', 'GEO_BLOCKED'],
    ['No space left on device', 'DISK_FULL'],
    ['ffmpeg merge failed', 'FFMPEG_FAILED'],
    ['Bad CPU type in executable', 'ENGINE_BAD_ARCH'],
  ])('maps %s', (stderr, code) => expect(mapEngineError(stderr).code).toBe(code))
})
