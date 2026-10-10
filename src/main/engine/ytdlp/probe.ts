import type { MediaFormat, MediaInfo } from '@shared/types/media'
import type { Result } from '@shared/types/result'
import { err, ok } from '@shared/types/result'
import { normalizeMediaUrl } from '@shared/utils/url'
import { z } from 'zod'

import { type BinaryService } from '../binaries'
import { ProcessRunner } from '../process-runner'
import { mapEngineError } from './errors'

const FormatSchema = z.looseObject({
  format_id: z.union([z.string(), z.number()]).transform(String),
  width: z.number().nullish(),
  height: z.number().nullish(),
  fps: z.number().nullish(),
  ext: z.string().nullish(),
  vcodec: z.string().nullish(),
  acodec: z.string().nullish(),
  tbr: z.number().nullish(),
  abr: z.number().nullish(),
  filesize: z.number().nullish(),
  filesize_approx: z.number().nullish(),
})

const ProbeSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().default('Untitled download'),
  uploader: z.string().nullish(),
  channel: z.string().nullish(),
  duration: z.number().nullish(),
  thumbnail: z.string().nullish(),
  thumbnails: z.array(z.looseObject({ url: z.string().nullish() })).nullish(),
  view_count: z.number().nullish(),
  upload_date: z.string().nullish(),
  webpage_url: z.string().nullish(),
  extractor_key: z.string().nullish(),
  extractor: z.string().nullish(),
  live_status: z.string().nullish(),
  is_live: z.boolean().nullish(),
  playlist_index: z.number().nullish(),
  formats: z.array(FormatSchema).default([]),
})

function optionalNumber(value: number | null | undefined): number | undefined {
  return value ?? undefined
}

function mapFormat(format: z.infer<typeof FormatSchema>): MediaFormat {
  return {
    id: format.format_id,
    ...(optionalNumber(format.width) !== undefined ? { width: optionalNumber(format.width) } : {}),
    ...(optionalNumber(format.height) !== undefined
      ? { height: optionalNumber(format.height) }
      : {}),
    ...(optionalNumber(format.fps) !== undefined ? { fps: optionalNumber(format.fps) } : {}),
    ...(format.ext ? { ext: format.ext } : {}),
    ...(format.vcodec ? { vcodec: format.vcodec } : {}),
    ...(format.acodec ? { acodec: format.acodec } : {}),
    ...(optionalNumber(format.tbr) !== undefined ? { tbr: optionalNumber(format.tbr) } : {}),
    ...(optionalNumber(format.abr) !== undefined ? { abr: optionalNumber(format.abr) } : {}),
    ...(optionalNumber(format.filesize) !== undefined
      ? { filesize: optionalNumber(format.filesize) }
      : {}),
    ...(optionalNumber(format.filesize_approx) !== undefined
      ? { filesizeApprox: optionalNumber(format.filesize_approx) }
      : {}),
  }
}

function nullish<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

function preferredText(
  primary: string | null | undefined,
  fallback: string | null | undefined,
): string | undefined {
  return primary ?? fallback ?? undefined
}

function bestThumbnail(raw: z.infer<typeof ProbeSchema>): string | undefined {
  return raw.thumbnails?.toReversed().find((item) => item.url)?.url ?? raw.thumbnail ?? undefined
}

export function parseProbeJson(json: string, requestedUrl: string): Result<MediaInfo> {
  try {
    const raw = ProbeSchema.parse(JSON.parse(json))
    if ([raw.is_live, raw.live_status === 'is_live'].includes(true)) {
      return err({
        code: 'LIVE_NOT_SUPPORTED',
        message: 'Live streams are not supported.',
        retryable: false,
      })
    }
    const media: MediaInfo = {
      id: raw.id,
      title: raw.title,
      uploader: preferredText(raw.uploader, raw.channel),
      durationSec: nullish(raw.duration),
      thumbnailUrl: bestThumbnail(raw),
      viewCount: nullish(raw.view_count),
      uploadDate: nullish(raw.upload_date),
      webpageUrl: raw.webpage_url ?? requestedUrl,
      extractor: raw.extractor_key ?? raw.extractor ?? 'Generic',
      isLive: false,
      isPlaylistEntry: Boolean(raw.playlist_index),
      formats: raw.formats.map(mapFormat),
    }
    return ok(media)
  } catch {
    return err({
      code: 'UNKNOWN',
      message: 'The media information was not understood.',
      retryable: true,
      hint: 'Update the engine and try again.',
    })
  }
}

export class MediaProbeService {
  readonly #cache = new Map<string, MediaInfo>()

  constructor(
    private readonly binaries: BinaryService,
    private readonly runner = new ProcessRunner(),
  ) {}

  async probe(inputUrl: string): Promise<Result<MediaInfo>> {
    const url = normalizeMediaUrl(inputUrl)
    if (!url)
      return err({
        code: 'INVALID_URL',
        message: 'Enter a valid http or https URL.',
        retryable: false,
      })
    const cached = this.#cache.get(url)
    if (cached) return ok(cached)
    const invocation = this.binaries.ytdlpInvocation([
      '-J',
      '--no-playlist',
      '--no-warnings',
      '--skip-download',
      '--',
      url,
    ])
    try {
      const result = await this.runner.run(invocation.file, invocation.args, {
        timeoutMs: 30_000,
        ...(invocation.env ? { env: invocation.env } : {}),
      })
      if (result.code !== 0) return err(mapEngineError(result.stderr))
      const parsed = parseProbeJson(result.stdout, url)
      if (parsed.ok) this.#cache.set(url, parsed.value)
      return parsed
    } catch (error) {
      return err(mapEngineError(error instanceof Error ? error.message : '', 'ENGINE_NOT_FOUND'))
    }
  }
}
