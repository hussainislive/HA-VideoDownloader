import type { DownloadOptions } from './media'

export interface HistoryItem {
  id: string
  url: string
  title: string
  uploader?: string | undefined
  thumbnailUrl?: string | undefined
  platform: string
  options: DownloadOptions
  filePath: string
  fileSize: number
  durationSec?: number | undefined
  completedAt: string
}

export interface LibraryItem extends HistoryItem {
  fileExists: boolean
}

export interface LibrarySearchInput {
  query: string
  kind?: 'video' | 'audio' | undefined
}
