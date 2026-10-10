export interface MediaFormat {
  id: string
  width?: number | undefined
  height?: number | undefined
  fps?: number | undefined
  ext?: string | undefined
  vcodec?: string | undefined
  acodec?: string | undefined
  tbr?: number | undefined
  abr?: number | undefined
  filesize?: number | undefined
  filesizeApprox?: number | undefined
}

export interface MediaInfo {
  id: string
  title: string
  uploader?: string | undefined
  durationSec?: number | undefined
  thumbnailUrl?: string | undefined
  viewCount?: number | undefined
  uploadDate?: string | undefined
  webpageUrl: string
  extractor: string
  isLive: boolean
  isPlaylistEntry: boolean
  formats: MediaFormat[]
}

export type DownloadKind = 'video' | 'audio'
export type VideoContainer = 'mp4' | 'mkv'
export type AudioFormat = 'mp3' | 'm4a' | 'wav'
export type AudioBitrate = 128 | 256 | 320
export type QualityTier = 480 | 720 | 1080 | 1440 | 2160

export interface DownloadOptions {
  kind: DownloadKind
  quality: QualityTier
  container: VideoContainer
  audioFormat: AudioFormat
  bitrate: AudioBitrate
  embedMetadata: boolean
  videoFormatId?: string | undefined
  audioFormatId?: string | undefined
}

export interface SizeEstimate {
  bytes: number
  approximate: boolean
}
