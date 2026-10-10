import { join } from 'node:path'

import type { DownloadJob } from '@shared/types/download'

export interface DownloadArgumentsContext {
  ffmpegPath: string
  forceGenericSelector?: boolean
}

const PROGRESS_TEMPLATE =
  'download:HA|%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s|%(progress.fragment_index)s|%(progress.fragment_count)s'

function selectorArguments(job: DownloadJob, forceGeneric: boolean): string[] {
  const options = job.options
  if (options.kind === 'audio') {
    const args = [
      '-f',
      options.audioFormatId ?? 'ba[ext=m4a]/ba/b',
      '-x',
      '--audio-format',
      options.audioFormat,
    ]
    if (options.audioFormat === 'mp3') args.push('--audio-quality', `${options.bitrate}K`)
    if (options.embedMetadata) args.push('--embed-metadata', '--embed-thumbnail')
    return args
  }
  const separateAudioId =
    options.audioFormatId !== options.videoFormatId ? options.audioFormatId : undefined
  const explicit =
    !forceGeneric && options.videoFormatId
      ? `${options.videoFormatId}${separateAudioId ? `+${separateAudioId}` : ''}`
      : options.container === 'mp4'
        ? `bv*[height<=${options.quality}][vcodec^=avc1]+ba[ext=m4a]/bv*[height<=${options.quality}]+ba/b[height<=${options.quality}]`
        : `bv*[height<=${options.quality}]+ba/b[height<=${options.quality}]`
  const args = ['-f', explicit, '--merge-output-format', options.container]
  if (options.embedMetadata) args.push('--embed-metadata')
  return args
}

export function buildDownloadArgs(job: DownloadJob, context: DownloadArgumentsContext): string[] {
  return [
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
    context.ffmpegPath,
    '-o',
    join(job.outputDir, '%(title).180B [%(id)s].%(ext)s'),
    '--progress',
    '--progress-template',
    PROGRESS_TEMPLATE,
    '--print',
    'after_move:HAFILE|%(filepath)s',
    '--no-simulate',
    ...selectorArguments(job, context.forceGenericSelector === true),
    '--',
    job.url,
  ]
}
