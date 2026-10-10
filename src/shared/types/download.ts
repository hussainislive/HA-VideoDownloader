import type { DownloadOptions } from './media'
import type { AppError } from './result'

export type DownloadState =
  | 'queued'
  | 'starting'
  | 'downloading'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'canceled'

export interface DownloadProgress {
  percent?: number | undefined
  downloadedBytes?: number | undefined
  totalBytes?: number | undefined
  speedBps?: number | undefined
  etaSec?: number | undefined
  phase: 'queued' | 'downloading' | 'merging' | 'converting' | 'finalizing' | 'completed'
}

export interface DownloadJob {
  id: string
  url: string
  mediaId: string
  title: string
  uploader?: string | undefined
  thumbnailUrl?: string | undefined
  platform: string
  durationSec?: number | undefined
  options: DownloadOptions
  outputDir: string
  state: DownloadState
  progress: DownloadProgress
  filePath?: string | undefined
  fileSizeBytes?: number | undefined
  error?: AppError | undefined
  createdAt: string
  startedAt?: string | undefined
  finishedAt?: string | undefined
  attempt: number
  stallRetries: number
  usedContainerFallback: boolean
  usedGenericFallback: boolean
}

export interface EnqueueDownloadInput {
  url: string
  mediaId: string
  title: string
  uploader?: string | undefined
  thumbnailUrl?: string | undefined
  platform: string
  durationSec?: number | undefined
  options: DownloadOptions
  outputDir: string
}

export interface DownloadSnapshot {
  jobs: DownloadJob[]
  activeCount: number
  aggregateSpeedBps: number
  recoveryCount: number
}
