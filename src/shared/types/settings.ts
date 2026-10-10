import type { AudioBitrate, AudioFormat, DownloadKind, QualityTier, VideoContainer } from './media'

export interface Settings {
  schemaVersion: 1
  downloadDir: string
  defaultKind: DownloadKind
  defaultQuality: QualityTier
  defaultContainer: VideoContainer
  defaultAudioFormat: AudioFormat
  defaultAudioBitrate: AudioBitrate
  maxConcurrent: number
  autoPasteClipboard: boolean
  notifyOnComplete: boolean
  embedMetadata: boolean
}

export interface SettingsUpdate {
  downloadDir?: string | undefined
  defaultKind?: DownloadKind | undefined
  defaultQuality?: QualityTier | undefined
  defaultContainer?: VideoContainer | undefined
  defaultAudioFormat?: AudioFormat | undefined
  defaultAudioBitrate?: AudioBitrate | undefined
  maxConcurrent?: number | undefined
  autoPasteClipboard?: boolean | undefined
  notifyOnComplete?: boolean | undefined
  embedMetadata?: boolean | undefined
}
