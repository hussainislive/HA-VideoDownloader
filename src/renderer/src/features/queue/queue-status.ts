import { COPY } from '@renderer/lib/copy'
import type { DownloadJob } from '@shared/types/download'

export interface JobStatusView {
  label: string
  tone: 'accent' | 'neutral' | 'danger' | 'warning' | 'info'
}

export function jobStatus(job: DownloadJob, queuedPosition?: number): JobStatusView {
  switch (job.state) {
    case 'queued':
      return { label: COPY.queue.statuses.queued(queuedPosition), tone: 'neutral' }
    case 'starting':
      return { label: COPY.queue.statuses.fetching, tone: 'info' }
    case 'downloading':
      return { label: COPY.queue.statuses.downloading, tone: 'accent' }
    case 'processing':
      return {
        label:
          job.options.kind === 'audio'
            ? COPY.queue.statuses.converting
            : COPY.queue.statuses.merging,
        tone: 'info',
      }
    case 'paused':
      return { label: COPY.queue.statuses.paused, tone: 'warning' }
    case 'completed':
      return { label: COPY.queue.statuses.completed, tone: 'accent' }
    case 'failed':
      return { label: COPY.queue.statuses.failed, tone: 'danger' }
    case 'canceled':
      return { label: COPY.queue.statuses.canceled, tone: 'neutral' }
  }
}
