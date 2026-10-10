import type { DownloadJob, DownloadSnapshot } from '@shared/types/download'

import type { DownloadCallbacks, DownloadRun } from '../engine/ytdlp/download'

export interface DownloadManagerHooks {
  completed(job: DownloadJob): void
  activity(snapshot: DownloadSnapshot): void
}

export interface DownloadEngine {
  start(job: DownloadJob, callbacks: DownloadCallbacks): DownloadRun
}
