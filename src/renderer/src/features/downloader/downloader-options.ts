import type { EnqueueDownloadInput } from '@shared/types/download'
import type { MediaInfo, QualityTier } from '@shared/types/media'
import type { Settings, SettingsUpdate } from '@shared/types/settings'
import { selectAudioFormat, selectVideoFormat } from '@shared/utils/media-formats'

import type { DownloaderOptions } from './downloader-types'

export const FALLBACK_OPTIONS: DownloaderOptions = {
  audioFormat: 'mp3',
  bitrate: 320,
  container: 'mp4',
  embedMetadata: true,
  kind: 'video',
  quality: 1080,
}

export function optionsFromSettings(settings: Settings | undefined): DownloaderOptions {
  if (!settings) return FALLBACK_OPTIONS
  return {
    audioFormat: settings.defaultAudioFormat,
    bitrate: settings.defaultAudioBitrate,
    container: settings.defaultContainer,
    embedMetadata: settings.embedMetadata,
    kind: settings.defaultKind,
    quality: settings.defaultQuality,
  }
}

export function closestQuality(
  available: readonly QualityTier[],
  preferred: QualityTier,
): QualityTier {
  return available.find((quality) => quality <= preferred) ?? available[0] ?? 480
}

export function settingsUpdate<Key extends keyof DownloaderOptions>(
  key: Key,
  value: DownloaderOptions[Key],
): SettingsUpdate {
  switch (key) {
    case 'kind':
      return { defaultKind: value as DownloaderOptions['kind'] }
    case 'quality':
      return { defaultQuality: value as DownloaderOptions['quality'] }
    case 'container':
      return { defaultContainer: value as DownloaderOptions['container'] }
    case 'audioFormat':
      return { defaultAudioFormat: value as DownloaderOptions['audioFormat'] }
    case 'bitrate':
      return { defaultAudioBitrate: value as DownloaderOptions['bitrate'] }
    case 'embedMetadata':
      return { embedMetadata: value as DownloaderOptions['embedMetadata'] }
  }
}

export function createEnqueueInput(
  media: MediaInfo,
  settings: Settings,
  options: DownloaderOptions,
  sourceUrl: string,
): EnqueueDownloadInput {
  const video = selectVideoFormat(media.formats, options.quality)
  const audio = selectAudioFormat(media.formats)
  return {
    url: sourceUrl,
    mediaId: media.id,
    title: media.title,
    ...(media.uploader ? { uploader: media.uploader } : {}),
    ...(media.thumbnailUrl ? { thumbnailUrl: media.thumbnailUrl } : {}),
    ...(media.durationSec !== undefined ? { durationSec: media.durationSec } : {}),
    platform: media.extractor,
    options: {
      ...options,
      ...(video ? { videoFormatId: video.id } : {}),
      ...(audio ? { audioFormatId: audio.id } : {}),
    },
    outputDir: settings.downloadDir,
  }
}
