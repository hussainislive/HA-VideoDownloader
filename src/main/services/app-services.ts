import { IPC_CHANNELS } from '@shared/ipc/channels'
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
  #shutdownPromise?: Promise<void>
  #startupNotices: string[] = []

  constructor(private readonly getWindow: () => BrowserWindow | null) {
    this.ready = this.#initialize()
  }

  async shutdown(): Promise<void> {
    this.#shutdownPromise ??= this.#performShutdown()
    await this.#shutdownPromise
  }

  get startupNotices(): readonly string[] {
    return this.#startupNotices
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
        completed: (job) => this.#notify(job, 'Download complete'),
        failed: (job) => this.#notify(job, 'Download failed'),
        activity: (snapshot) => this.#showActivity(snapshot),
      },
    )
    await this.downloads.initialize(this.settings.value.maxConcurrent)
    if (this.settings.recoveredFromCorruption)
      this.#startupNotices.push(
        'Damaged settings were quarantined and safe defaults were restored.',
      )
    if (this.history.recoveredFromCorruption)
      this.#startupNotices.push('Damaged library history was quarantined and reset safely.')
    if (this.queue.recoveredFromCorruption)
      this.#startupNotices.push('Damaged queue data was quarantined and reset safely.')
    if (this.settings.initializationIssue)
      this.#startupNotices.push(this.settings.initializationIssue)
  }

  async #performShutdown(): Promise<void> {
    await this.ready.catch(() => undefined)
    await this.downloads?.shutdown()
    await this.settings.flush()
  }

  #notify(job: DownloadJob, title: string): void {
    const window = this.getWindow()
    if (
      !this.settings.value.notifyOnComplete ||
      (window && !window.isDestroyed() && window.isFocused())
    )
      return
    if (!Notification.isSupported()) return
    if (process.platform === 'darwin' && app.dock) app.dock.bounce('informational')
    const notification = new Notification({ title, body: job.title })
    notification.on('click', () => {
      const current = this.getWindow()
      if (current && !current.isDestroyed()) {
        current.show()
        current.focus()
        current.webContents.send(IPC_CHANNELS.system.navigate, 'queue')
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
