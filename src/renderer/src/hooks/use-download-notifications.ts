import { useToast } from '@renderer/components/ui/Toast'
import { COPY } from '@renderer/lib/copy'
import { useDownloadStore } from '@renderer/store/download-store'
import { navigateToTab } from '@renderer/store/ui-store'
import { useEffect } from 'react'

export function useDownloadNotifications(): void {
  const { showToast } = useToast()
  useEffect(() => {
    const knownCompleted = new Set(
      Object.values(useDownloadStore.getState().jobsById)
        .filter((job) => job.state === 'completed')
        .map((job) => job.id),
    )
    return useDownloadStore.subscribe((state) => {
      for (const job of Object.values(state.jobsById)) {
        if (job.state !== 'completed' || knownCompleted.has(job.id)) continue
        knownCompleted.add(job.id)
        showToast(`${COPY.queue.completed}: ${job.title}`, {
          label: COPY.downloader.viewQueue,
          onClick: () => navigateToTab('queue'),
        })
      }
    })
  }, [showToast])
}
