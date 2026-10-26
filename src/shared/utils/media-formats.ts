import type { AudioBitrate, MediaFormat, QualityTier, SizeEstimate } from '../types/media'

const QUALITY_TIERS: readonly QualityTier[] = [4320, 2160, 1440, 1080, 720, 480]

function hasVideo(format: MediaFormat): boolean {
  return Boolean(format.vcodec && format.vcodec !== 'none')
}

function hasAudio(format: MediaFormat): boolean {
  return Boolean(format.acodec && format.acodec !== 'none')
}

export function formatResolution(format: MediaFormat): number | undefined {
  if (format.width && format.height) return Math.min(format.width, format.height)
  return format.height ?? format.width
}

export function availableQualityTiers(formats: readonly MediaFormat[]): QualityTier[] {
  return QUALITY_TIERS.filter((tier) =>
    formats.some((format) => {
      const resolution = formatResolution(format)
      return hasVideo(format) && resolution !== undefined && resolution >= tier * 0.95
    }),
  )
}

function knownSize(
  format: MediaFormat,
  durationSec?: number,
): { bytes: number; approximate: boolean } | undefined {
  if (format.filesize !== undefined) return { bytes: format.filesize, approximate: false }
  if (format.filesizeApprox !== undefined)
    return { bytes: format.filesizeApprox, approximate: true }
  if (format.tbr !== undefined && durationSec !== undefined) {
    return { bytes: (format.tbr * 1_000 * durationSec) / 8, approximate: true }
  }
  return undefined
}

export function selectVideoFormat(
  formats: readonly MediaFormat[],
  tier: QualityTier,
): MediaFormat | undefined {
  const candidates = formats.filter((format) => {
    const resolution = formatResolution(format)
    return hasVideo(format) && resolution !== undefined && resolution <= tier * 1.05
  })
  const videoOnly = candidates.filter((format) => !hasAudio(format))
  return (videoOnly.length > 0 ? videoOnly : candidates)
    .slice()
    .sort((left, right) => (formatResolution(right) ?? 0) - (formatResolution(left) ?? 0))[0]
}

export function selectAudioFormat(formats: readonly MediaFormat[]): MediaFormat | undefined {
  const candidates = formats.filter(hasAudio)
  const audioOnly = candidates.filter((format) => !hasVideo(format))
  return (audioOnly.length > 0 ? audioOnly : candidates)
    .slice()
    .sort((left, right) => (right.abr ?? right.tbr ?? 0) - (left.abr ?? left.tbr ?? 0))[0]
}

export function estimateVideoSize(
  formats: readonly MediaFormat[],
  tier: QualityTier,
  durationSec?: number,
): SizeEstimate | undefined {
  const video = selectVideoFormat(formats, tier)
  const audio = selectAudioFormat(formats)
  if (!video) return undefined
  const videoSize = knownSize(video, durationSec)
  const audioSize = !audio || audio.id === video.id ? undefined : knownSize(audio, durationSec)
  const sizes = [videoSize, audioSize].filter(
    (size): size is { bytes: number; approximate: boolean } => size !== undefined,
  )
  if (sizes.length === 0) return undefined
  return {
    bytes: sizes.reduce((total, size) => total + size.bytes, 0),
    approximate: sizes.some((size) => size.approximate),
  }
}

export function estimateAudioSize(
  durationSec: number | undefined,
  bitrate: AudioBitrate,
): SizeEstimate | undefined {
  if (durationSec === undefined) return undefined
  return { bytes: (bitrate * 1_000 * durationSec) / 8, approximate: true }
}
