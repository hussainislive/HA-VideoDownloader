import { Button } from '@renderer/components/ui/Button'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Spinner } from '@renderer/components/ui/Spinner'
import { useToast } from '@renderer/components/ui/Toast'
import { COPY } from '@renderer/lib/copy'
import { formatSpeed } from '@renderer/lib/format'
import { selectQueueCount, useDownloadStore } from '@renderer/store/download-store'
import { navigateToTab } from '@renderer/store/ui-store'
import { Gauge, ListChecks, Trash2 } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'

import { DownloadCard } from './components/DownloadCard'

export default function QueueScreen(): React.JSX.Element {
  const orderedIds = useDownloadStore((state) => state.orderedIds)
  const count = useDownloadStore(selectQueueCount)
  const completedCount = useDownloadStore((state) =>
    state.orderedIds.reduce(
      (total, id) => total + (state.jobsById[id]?.state === 'completed' ? 1 : 0),
      0,
    ),
  )
  const speed = useDownloadStore((state) => state.aggregateSpeedBps)
  const hydration = useDownloadStore((state) => state.hydration)
  const error = useDownloadStore((state) => state.error)
  const recoveryCount = useDownloadStore((state) => state.recoveryCount)
  const [recoveryDismissed, setRecoveryDismissed] = useState(false)
  const { showToast } = useToast()

  const clearCompleted = (): void => {
    void window.api.downloads.clearCompleted().then((result) => {
      if (!result.ok) showToast(result.error.message)
    })
  }

  const resumeRecovered = (): void => {
    setRecoveryDismissed(true)
    const state = useDownloadStore.getState()
    const recoverable = state.orderedIds.filter((id) => {
      const status = state.jobsById[id]?.state
      return status === 'paused' || status === 'queued'
    })
    void Promise.all(recoverable.map((id) => window.api.downloads.resume(id))).then((results) => {
      const failed = results.find((result) => !result.ok)
      if (failed && !failed.ok) showToast(failed.error.message)
    })
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col" data-testid="queue-screen">
      <header className="mb-3 flex h-9 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="border-line bg-accent-soft text-accent flex size-8 items-center justify-center rounded-xl border">
            <ListChecks aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h1 className="text-fg-heading text-sm font-bold">{COPY.queue.title}</h1>
            <p className="text-fg-muted text-[9px]">{COPY.queue.activeSummary(count)}</p>
          </div>
        </div>
        <Button disabled={completedCount === 0} onClick={clearCompleted} size="sm" variant="ghost">
          <Trash2 aria-hidden="true" className="size-3.5" /> {COPY.queue.clearCompleted}
        </Button>
      </header>

      {hydration === 'loading' ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner label={COPY.accessibility.loading} />
        </div>
      ) : hydration === 'error' ? (
        <EmptyState
          actionLabel={COPY.queue.openDownloader}
          description={error ?? COPY.queue.unavailableDescription}
          icon={ListChecks}
          onAction={() => navigateToTab('downloader')}
          title={COPY.queue.unavailableTitle}
        />
      ) : orderedIds.length === 0 ? (
        <EmptyState
          actionLabel={COPY.queue.openDownloader}
          description={COPY.queue.emptyDescription}
          icon={ListChecks}
          onAction={() => navigateToTab('downloader')}
          title={COPY.queue.emptyTitle}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1" data-testid="queue-list">
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {orderedIds.map((id) => (
                <DownloadCard id={id} key={id} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {speed > 0 ? (
        <footer className="border-line-subtle text-fg-muted mt-2 flex h-7 shrink-0 items-center justify-end gap-1.5 border-t pt-2 text-[10px]">
          <Gauge aria-hidden="true" className="text-accent size-3.5" />
          {COPY.queue.aggregateSpeed}:{' '}
          <span className="telemetry text-fg-body">{formatSpeed(speed)}</span>
        </footer>
      ) : null}
      <ConfirmDialog
        confirmLabel={COPY.queue.resumeAll}
        description={COPY.queue.resumeDescription}
        onCancel={() => setRecoveryDismissed(true)}
        onConfirm={resumeRecovered}
        open={recoveryCount > 0 && !recoveryDismissed}
        title={COPY.queue.resumeTitle}
      />
    </div>
  )
}
