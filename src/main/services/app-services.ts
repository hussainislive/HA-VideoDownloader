import type { DownloadJob, DownloadSnapshot } from '@shared/types/download'
import type { BrowserWindow } from 'electron'
import { app, Notification } from 'electron'

import { DownloadManager } from '../downloads/download-manager'
import { BinaryService } from '../engine/binaries'
import { EngineUpdater } from '../engine/updater'
import { YtdlpDownloadService } from '../engine/ytdlp/download'
import { MediaProbeService } from '../engine/ytdlp/probe'
import { HistoryStore } from './history-store'
import { QueueStore } from './queue-store'
import { SettingsStore } from './settings-store'

export class AppServices {
  readonly binaries = new BinaryService()
  readonly settings = new SettingsStore(app.getPath('userData'), app.getPath('downloads'))
  readonly history = new HistoryStore(app.getPath('userData'))
  readonly queue = new QueueStore(app.getPath('userData'))
  probe?: MediaProbeService
  updater?: EngineUpdater
  downloads?: DownloadManager
  readonly ready: Promise<void>

  constructor(private readonly getWindow: () => BrowserWindow | null) {
    this.ready = this.#initialize()
  }

  async shutdown(): Promise<void> {
    await this.ready.catch(() => undefined)
    await this.downloads?.shutdown()
    await this.settings.flush()
  }

  async #initialize(): Promise<void> {
    await Promise.all([
      this.binaries.initialize(),
      this.settings.initialize(),
      this.history.initialize(),
    ])
    this.probe = new MediaProbeService(this.binaries)
    this.updater = new EngineUpdater(this.binaries)
    this.downloads = new DownloadManager(
      this.queue,
      this.history,
      new YtdlpDownloadService(this.binaries),
      {
        completed: (job) => this.#notify(job),
        activity: (snapshot) => this.#showActivity(snapshot),
      },
    )
    await this.downloads.initialize(this.settings.value.maxConcurrent)
  }

  #notify(job: DownloadJob): void {
    const window = this.getWindow()
    if (
      !this.settings.value.notifyOnComplete ||
      (window && !window.isDestroyed() && window.isFocused())
    )
      return
    if (!Notification.isSupported()) return
    if (process.platform === 'darwin' && app.dock) app.dock.bounce('informational')
    const notification = new Notification({ title: 'Download complete', body: job.title })
    notification.on('click', () => {
      const current = this.getWindow()
      if (current && !current.isDestroyed()) {
        current.show()
        current.focus()
      }
    })
    notification.show()
  }

  #showActivity(snapshot: DownloadSnapshot): void {
    if (process.platform === 'darwin' && app.dock) {
      const pendingCount = snapshot.jobs.filter((job) =>
        ['queued', 'starting', 'downloading', 'processing'].includes(job.state),
      ).length
      app.dock.setBadge(pendingCount > 0 ? String(pendingCount) : '')
    }
    const active = snapshot.jobs.filter((job) =>
      ['starting', 'downloading', 'processing'].includes(job.state),
    )
    const percent = active.length
      ? active.reduce((sum, job) => sum + (job.progress.percent ?? 0), 0) / active.length / 100
      : -1
    const window = this.getWindow()
    if (window && !window.isDestroyed()) window.setProgressBar(percent)
  }
}
