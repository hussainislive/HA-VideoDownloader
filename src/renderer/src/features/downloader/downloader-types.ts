import type {
  AudioBitrate,
  AudioFormat,
  DownloadKind,
  MediaInfo,
  QualityTier,
  SizeEstimate,
  VideoContainer,
} from '@shared/types/media'

export type LinkPhase = 'idle' | 'typing' | 'validating' | 'probing' | 'ready' | 'error'

export interface DownloaderOptions {
  audioFormat: AudioFormat
  bitrate: AudioBitrate
  container: VideoContainer
  embedMetadata: boolean
  kind: DownloadKind
  quality: QualityTier
}

export interface DownloaderController {
  availableQualities: readonly QualityTier[]
  clear: () => void
  freeBytes?: number | undefined
  isEnqueuing: boolean
  lowDiskWarning: boolean
  media?: MediaInfo | undefined
  options: DownloaderOptions
  paste: () => Promise<void>
  phase: LinkPhase
  probeNow: () => void
  selectFolder: () => Promise<void>
  setLowDiskWarning: (value: boolean) => void
  setOption: <Key extends keyof DownloaderOptions>(key: Key, value: DownloaderOptions[Key]) => void
  setUrl: (value: string, userInitiated?: boolean) => void
  sizeEstimate?: SizeEstimate | undefined
  submit: (skipDiskWarning?: boolean, preserveUrl?: boolean) => Promise<void>
  url: string
  userMessage?: string | undefined
}
