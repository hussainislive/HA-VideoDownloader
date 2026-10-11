import type { DownloadJob, DownloadSnapshot } from '@shared/types/download'
import { type BrowserWindow, dialog } from 'electron'

import { logger } from '../logger'

const ACTIVE_STATES: ReadonlySet<DownloadJob['state']> = new Set([
  'starting',
  'downloading',
  'processing',
])

export function activeDownloadCount(snapshot: DownloadSnapshot | undefined): number {
  return snapshot?.jobs.filter((job) => ACTIVE_STATES.has(job.state)).length ?? 0
}

interface CloseGuardOptions {
  activeCount: () => number
  shutdown: () => Promise<void>
}

export function installCloseGuard(window: BrowserWindow, options: CloseGuardOptions): void {
  let allowClose = false
  let closeInProgress = false

  window.on('close', (event) => {
    if (allowClose) return
    event.preventDefault()
    if (closeInProgress) return
    closeInProgress = true

    const finish = async (): Promise<void> => {
      try {
        await options.shutdown()
      } catch (error) {
        logger.error('Application shutdown failed', error)
      } finally {
        allowClose = true
        if (!window.isDestroyed()) window.close()
      }
    }

    if (options.activeCount() === 0) {
      void finish()
      return
    }

    void dialog
      .showMessageBox(window, {
        type: 'warning',
        title: 'Downloads are still active',
        message: 'Pause active downloads and quit?',
        detail: 'Partial files will be kept and offered for resume the next time you open the app.',
        buttons: ['Keep Downloading', 'Pause & Quit'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      })
      .then((result) => {
        if (result.response === 1) void finish()
        else closeInProgress = false
      })
      .catch((error: unknown) => {
        closeInProgress = false
        logger.error('Unable to show the active-download close confirmation', error)
      })
  })
}
