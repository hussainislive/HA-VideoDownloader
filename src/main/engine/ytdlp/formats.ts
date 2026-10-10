import type { AudioBitrate, MediaFormat, QualityTier, SizeEstimate } from '@shared/types/media'

const TIERS: readonly QualityTier[] = [2160, 1440, 1080, 720, 480]

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
  return TIERS.filter((tier) =>
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

function distinctAudioSize(
  audio: MediaFormat | undefined,
  video: MediaFormat,
  durationSec: number | undefined,
): { bytes: number; approximate: boolean } | undefined {
  if (!audio || audio.id === video.id) return undefined
  return knownSize(audio, durationSec)
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
  return (videoOnly.length > 0 ? videoOnly : candidates).toSorted(
    (left, right) => (formatResolution(right) ?? 0) - (formatResolution(left) ?? 0),
  )[0]
}

export function selectAudioFormat(formats: readonly MediaFormat[]): MediaFormat | undefined {
  const candidates = formats.filter(hasAudio)
  const audioOnly = candidates.filter((format) => !hasVideo(format))
  return (audioOnly.length > 0 ? audioOnly : candidates).toSorted(
    (left, right) => (right.abr ?? right.tbr ?? 0) - (left.abr ?? left.tbr ?? 0),
  )[0]
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
  const audioSize = distinctAudioSize(audio, video, durationSec)
  if (!videoSize && !audioSize) return undefined
  return {
    bytes: (videoSize?.bytes ?? 0) + (audioSize?.bytes ?? 0),
    approximate: videoSize?.approximate === true || audioSize?.approximate === true,
  }
}

export function estimateAudioSize(
  durationSec: number | undefined,
  bitrate: AudioBitrate,
): SizeEstimate | undefined {
  if (durationSec === undefined) return undefined
  return { bytes: (bitrate * 1_000 * durationSec) / 8, approximate: true }
}
