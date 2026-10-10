import type { AppError } from './result'

export interface BinaryStatus {
  found: boolean
  version?: string
  path: string
}

export interface EngineStatus {
  ytdlp: BinaryStatus
  ffmpeg: BinaryStatus
  arch: string
  ok: boolean
  error?: AppError | undefined
}

export interface EngineUpdateResult {
  before: string
  after: string
  updated: boolean
}
