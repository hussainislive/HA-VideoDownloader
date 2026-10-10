import type { Result } from '@shared/types/result'
import { err } from '@shared/types/result'
import type { BrowserWindow } from 'electron'

import { logger } from '../logger'

export function ipcFailure(error: unknown): Result<never> {
  logger.error('IPC action failed', error)
  return err({
    code: 'SYSTEM_ACTION_FAILED',
    message:
      error instanceof Error && error.message.includes('writable')
        ? 'The selected folder is not writable.'
        : 'The requested action could not be completed.',
    retryable: true,
  })
}

export function invalidRequest(): Result<never> {
  return err({ code: 'INVALID_REQUEST', message: 'The request was not valid.', retryable: false })
}

export function safeSend(window: BrowserWindow | null, channel: string, value: unknown): void {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return
  window.webContents.send(channel, value)
}
