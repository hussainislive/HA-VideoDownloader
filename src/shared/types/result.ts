export type AppErrorCode =
  | 'CANCELED'
  | 'DISK_FULL'
  | 'ENGINE_BAD_ARCH'
  | 'ENGINE_NOT_FOUND'
  | 'ENGINE_UPDATE_FAILED'
  | 'EXTERNAL_URL_BLOCKED'
  | 'FFMPEG_FAILED'
  | 'FFMPEG_MISSING'
  | 'FILENAME_TOO_LONG'
  | 'FORMAT_UNAVAILABLE'
  | 'GEO_BLOCKED'
  | 'HTTP_403_OR_BLOCKED'
  | 'INVALID_REQUEST'
  | 'INVALID_URL'
  | 'LIVE_NOT_SUPPORTED'
  | 'LOGIN_REQUIRED'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_STALLED'
  | 'PERMISSION_DENIED'
  | 'SYSTEM_ACTION_FAILED'
  | 'UNKNOWN'
  | 'UNSUPPORTED_URL'
  | 'VIDEO_UNAVAILABLE'

export interface AppError {
  code: AppErrorCode
  message: string
  detail?: string | undefined
  retryable: boolean
  hint?: string | undefined
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })

export const err = <T>(error: AppError): Result<T> => ({ ok: false, error })
