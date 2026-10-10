import type { DownloadJob, DownloadSnapshot } from '@shared/types/download'
import { create } from 'zustand'

type HydrationState = 'loading' | 'ready' | 'error'

interface DownloadStoreState {
  activeCount: number
  aggregateSpeedBps: number
  error: string | undefined
  hydration: HydrationState
  jobsById: Readonly<Record<string, DownloadJob>>
  orderedIds: readonly string[]
  recoveryCount: number
  applySnapshot: (snapshot: DownloadSnapshot) => void
  setError: (message: string) => void
}

function sameProgress(left: DownloadJob, right: DownloadJob): boolean {
  const a = left.progress
  const b = right.progress
  return (
    a.phase === b.phase &&
    a.percent === b.percent &&
    a.downloadedBytes === b.downloadedBytes &&
    a.totalBytes === b.totalBytes &&
    a.speedBps === b.speedBps &&
    a.etaSec === b.etaSec
  )
}

function sameIdentity(left: DownloadJob, right: DownloadJob): boolean {
  return (
    left.url === right.url &&
    left.mediaId === right.mediaId &&
    left.title === right.title &&
    left.uploader === right.uploader &&
    left.thumbnailUrl === right.thumbnailUrl &&
    left.platform === right.platform &&
    left.durationSec === right.durationSec &&
    left.outputDir === right.outputDir
  )
}

function sameLifecycle(left: DownloadJob, right: DownloadJob): boolean {
  return (
    left.state === right.state &&
    left.filePath === right.filePath &&
    left.fileSizeBytes === right.fileSizeBytes &&
    left.createdAt === right.createdAt &&
    left.startedAt === right.startedAt &&
    left.finishedAt === right.finishedAt &&
    left.attempt === right.attempt &&
    left.stallRetries === right.stallRetries &&
    left.usedContainerFallback === right.usedContainerFallback &&
    left.usedGenericFallback === right.usedGenericFallback
  )
}

function sameOptions(left: DownloadJob, right: DownloadJob): boolean {
  const a = left.options
  const b = right.options
  return (
    a.kind === b.kind &&
    a.quality === b.quality &&
    a.container === b.container &&
    a.audioFormat === b.audioFormat &&
    a.bitrate === b.bitrate &&
    a.embedMetadata === b.embedMetadata &&
    a.videoFormatId === b.videoFormatId &&
    a.audioFormatId === b.audioFormatId
  )
}

function sameError(left: DownloadJob, right: DownloadJob): boolean {
  const a = left.error
  const b = right.error
  if (!a || !b) return a === b
  return (
    a.code === b.code &&
    a.message === b.message &&
    a.detail === b.detail &&
    a.retryable === b.retryable &&
    a.hint === b.hint
  )
}

function sameJob(left: DownloadJob, right: DownloadJob): boolean {
  return (
    sameIdentity(left, right) &&
    sameLifecycle(left, right) &&
    sameOptions(left, right) &&
    sameError(left, right) &&
    sameProgress(left, right)
  )
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

const STATE_ORDER: Readonly<Record<DownloadJob['state'], number>> = {
  starting: 0,
  downloading: 0,
  processing: 0,
  queued: 1,
  paused: 2,
  completed: 3,
  failed: 3,
  canceled: 3,
}

function queueOrder(left: DownloadJob, right: DownloadJob): number {
  const groupDifference = STATE_ORDER[left.state] - STATE_ORDER[right.state]
  if (groupDifference !== 0) return groupDifference
  if (STATE_ORDER[left.state] === 3)
    return (right.finishedAt ?? right.createdAt).localeCompare(left.finishedAt ?? left.createdAt)
  return (left.startedAt ?? left.createdAt).localeCompare(right.startedAt ?? right.createdAt)
}

export const useDownloadStore = create<DownloadStoreState>((set) => ({
  activeCount: 0,
  aggregateSpeedBps: 0,
  error: undefined,
  hydration: 'loading',
  jobsById: {},
  orderedIds: [],
  recoveryCount: 0,
  applySnapshot: (snapshot) =>
    set((current) => {
      const jobsById: Record<string, DownloadJob> = {}
      for (const job of snapshot.jobs) {
        const previous = current.jobsById[job.id]
        jobsById[job.id] = previous && sameJob(previous, job) ? previous : job
      }
      const incomingIds = snapshot.jobs
        .slice()
        .sort(queueOrder)
        .map((job) => job.id)
      return {
        activeCount: snapshot.activeCount,
        aggregateSpeedBps: snapshot.aggregateSpeedBps,
        error: undefined,
        hydration: 'ready',
        jobsById,
        orderedIds: sameIds(current.orderedIds, incomingIds) ? current.orderedIds : incomingIds,
        recoveryCount: snapshot.recoveryCount,
      }
    }),
  setError: (message) => set({ error: message, hydration: 'error' }),
}))

const COUNTED_STATES = new Set(['queued', 'starting', 'downloading', 'processing', 'paused'])

export function selectQueueCount(state: DownloadStoreState): number {
  let count = 0
  for (const id of state.orderedIds) {
    const job = state.jobsById[id]
    if (job && COUNTED_STATES.has(job.state)) count += 1
  }
  return count
}
