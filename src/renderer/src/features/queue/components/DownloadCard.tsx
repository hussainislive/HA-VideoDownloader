import { Badge } from '@renderer/components/ui/Badge'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { useToast } from '@renderer/components/ui/Toast'
import { COPY } from '@renderer/lib/copy'
import { formatBytes, formatEta, formatSpeed, formatTime } from '@renderer/lib/format'
import { useDownloadStore } from '@renderer/store/download-store'
import type { DownloadJob } from '@shared/types/download'
import { FileAudio2, FileVideo2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { memo, useCallback, useState } from 'react'

import { jobStatus, type JobStatusView } from '../queue-status'
import { DownloadCardActions } from './DownloadCardActions'

interface DownloadCardProps {
  id: string
}

const PROGRESS_STATES = new Set<DownloadJob['state']>([
  'starting',
  'downloading',
  'processing',
  'paused',
])

function DownloadDetails({
  job,
  status,
}: {
  job: DownloadJob
  status: JobStatusView
}): React.JSX.Element {
  const progress = job.progress.percent ?? 0
  const indeterminate = job.state === 'starting' || job.state === 'processing'
  if (PROGRESS_STATES.has(job.state)) {
    return (
      <div className="mt-2">
        <div className="text-fg-muted mb-1 flex items-center justify-between gap-3 text-[9px]">
          <span className="telemetry">
            {job.state === 'downloading'
              ? `${progress.toFixed(1)}% · ${formatSpeed(job.progress.speedBps)} · ${formatEta(job.progress.etaSec)}`
              : status.label}
          </span>
          <span className="telemetry shrink-0">
            {formatBytes(job.progress.downloadedBytes)} / {formatBytes(job.progress.totalBytes)}
          </span>
        </div>
        <ProgressBar
          indeterminate={indeterminate}
          label={`${job.title} progress`}
          value={progress}
        />
      </div>
    )
  }
  if (job.state === 'failed') {
    return (
      <p className="text-danger mt-1 truncate text-[10px]" title={job.error?.message}>
        {job.error?.message ?? COPY.queue.downloadFailed}
      </p>
    )
  }
  const variant =
    job.options.kind === 'video'
      ? `${job.options.quality}p · ${job.options.container.toUpperCase()}`
      : `${job.options.audioFormat.toUpperCase()} · ${COPY.downloader.bitrateValue(job.options.bitrate)}`
  const completed =
    job.state === 'completed'
      ? ` · ${formatBytes(job.fileSizeBytes)} · ${formatTime(job.finishedAt) ?? COPY.queue.finished}`
      : ''
  return <p className="text-fg-muted mt-1 text-[10px]">{variant + completed}</p>
}

export const DownloadCard = memo(function DownloadCard({
  id,
}: DownloadCardProps): React.JSX.Element | null {
  const job = useDownloadStore((state) => state.jobsById[id])
  const queuedPosition = useDownloadStore((state) => {
    const index = state.orderedIds
      .filter((candidateId) => state.jobsById[candidateId]?.state === 'queued')
      .indexOf(id)
    return index < 0 ? undefined : index + 1
  })
  const { showToast } = useToast()
  const reduceMotion = useReducedMotion()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const run = useCallback(
    (action: () => Promise<unknown>): void => {
      void action().then((result) => {
        if (
          typeof result === 'object' &&
          result !== null &&
          'ok' in result &&
          result.ok === false &&
          'error' in result
        ) {
          const failed = result as { error: { message: string } }
          showToast(failed.error.message)
        }
      })
    },
    [showToast],
  )
  if (!job) return null
  const status = jobStatus(job, queuedPosition)
  const progress = job.progress.percent ?? 0
  const cancel = (): void => {
    if (progress > 5) setConfirmCancel(true)
    else run(() => window.api.downloads.cancel(job.id))
  }
  const remove = (): void => run(() => window.api.downloads.remove(job.id))
  const copyLink = (): void => {
    void window.api.clipboard.writeText(job.url).then((result) => {
      showToast(result.ok ? COPY.queue.linkCopied : result.error.message)
    })
  }
  const deleteFile = (): void => {
    setConfirmDelete(false)
    void window.api.library.delete(job.id, true).then((result) => {
      if (!result.ok) showToast(result.error.message)
      else run(() => window.api.downloads.remove(job.id))
    })
  }

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="download-card border-line bg-surface-solid grid min-h-[82px] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-2"
      data-job-id={job.id}
      data-state={job.state}
      exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 7 }}
      layout="position"
      transition={{ duration: reduceMotion ? 0.08 : 0.18 }}
    >
      <span className="border-line bg-surface-elevated text-accent flex size-10 items-center justify-center rounded-xl border">
        {job.options.kind === 'audio' ? (
          <FileAudio2 className="size-5" />
        ) : (
          <FileVideo2 className="size-5" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h2
            className="text-fg-heading min-w-0 flex-1 truncate text-xs font-bold"
            title={job.title}
          >
            {job.title}
          </h2>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <DownloadDetails job={job} status={status} />
      </div>
      <DownloadCardActions
        job={job}
        onCancel={cancel}
        onCopy={copyLink}
        onDelete={() => setConfirmDelete(true)}
        onRemove={remove}
        onRun={run}
      />
      <ConfirmDialog
        confirmLabel={COPY.actions.cancel}
        description={COPY.queue.cancelDescription}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false)
          run(() => window.api.downloads.cancel(job.id))
        }}
        open={confirmCancel}
        title={COPY.queue.cancelTitle}
      />
      <ConfirmDialog
        confirmLabel={COPY.queue.deleteFile}
        description={COPY.queue.deleteDescription}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteFile}
        open={confirmDelete}
        title={COPY.queue.deleteTitle}
      />
    </motion.article>
  )
})
