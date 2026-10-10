import type { DownloadJob, DownloadState } from '@shared/types/download'

const ALLOWED: Readonly<Record<DownloadState, readonly DownloadState[]>> = {
  queued: ['starting', 'canceled'],
  starting: ['downloading', 'paused', 'failed', 'canceled'],
  downloading: ['processing', 'paused', 'completed', 'failed', 'canceled'],
  processing: ['paused', 'completed', 'failed', 'canceled'],
  paused: ['queued', 'canceled'],
  completed: [],
  failed: ['queued', 'canceled'],
  canceled: ['queued'],
}

export function canTransition(from: DownloadState, to: DownloadState): boolean {
  return ALLOWED[from].includes(to)
}

export function transitionJob(job: DownloadJob, state: DownloadState, strict = true): DownloadJob {
  if (!canTransition(job.state, state)) {
    if (strict) throw new Error(`Illegal download transition: ${job.state} -> ${state}`)
    return job
  }
  const now = new Date().toISOString()
  return {
    ...job,
    state,
    ...(state === 'starting' && !job.startedAt ? { startedAt: now } : {}),
    ...(['completed', 'failed', 'canceled'].includes(state) ? { finishedAt: now } : {}),
  }
}

export function recoverJobs(jobs: readonly DownloadJob[]): {
  jobs: DownloadJob[]
  recoveryIds: Set<string>
} {
  const recoveryIds = new Set<string>()
  const recovered = jobs.map((job) => {
    if (['starting', 'downloading', 'processing'].includes(job.state)) {
      recoveryIds.add(job.id)
      return { ...job, state: 'paused' as const }
    }
    if (job.state === 'queued' || job.state === 'paused') recoveryIds.add(job.id)
    return job
  })
  return { jobs: recovered, recoveryIds }
}
