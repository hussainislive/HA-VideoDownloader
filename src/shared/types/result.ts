export type AppErrorCode = 'EXTERNAL_URL_BLOCKED' | 'INVALID_REQUEST' | 'SYSTEM_ACTION_FAILED'

export interface AppError {
  code: AppErrorCode
  message: string
  detail?: string
  retryable: boolean
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })

export const err = <T>(error: AppError): Result<T> => ({ ok: false, error })
