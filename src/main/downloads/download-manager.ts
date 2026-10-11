import { randomUUID } from 'node:crypto'

import type {
  DownloadJob,
  DownloadProgress,
  DownloadSnapshot,
  EnqueueDownloadInput,
} from '@shared/types/download'

import type { DownloadRun } from '../engine/ytdlp/download'
import { logger } from '../logger'
import { cleanupJobPartials } from '../services/filename'
import type { HistoryStore } from '../services/history-store'
import type { QueueStore } from '../services/queue-store'
import type { DownloadEngine, DownloadManagerHooks } from './contracts'
import { completedJob, failedOrRetryJob } from './download-outcome'
import { recoverJobs, transitionJob } from './job'

export class DownloadManager {
  readonly #listeners = new Set<(snapshot: DownloadSnapshot) => void>()
  readonly #active = new Map<string, DownloadRun>()
  readonly #desired = new Map<string, 'pause' | 'cancel'>()
  readonly #settling = new Map<string, Promise<void>>()
  readonly #recoveryIds = new Set<string>()
  #jobs: DownloadJob[] = []
  #maxConcurrent = 2
  #emitTimer: NodeJS.Timeout | undefined
  #shuttingDown = false

  constructor(
    private readonly queue: QueueStore,
    private readonly history: HistoryStore,
    private readonly engine: DownloadEngine,
    private readonly hooks: DownloadManagerHooks,
  ) {}

  async initialize(maxConcurrent: number): Promise<DownloadSnapshot> {
    this.#maxConcurrent = maxConcurrent
    const persisted = (await this.queue.load()).filter((job) => job.state !== 'completed')
    const recovered = recoverJobs(persisted)
    this.#jobs = recovered.jobs
    for (const id of recovered.recoveryIds) this.#recoveryIds.add(id)
    this.#changed(true)
    return this.snapshot()
  }

  snapshot(): DownloadSnapshot {
    return {
      jobs: structuredClone(this.#jobs),
      activeCount: this.#active.size,
      aggregateSpeedBps: this.#jobs.reduce(
        (sum, job) => (job.state === 'downloading' ? sum + (job.progress.speedBps ?? 0) : sum),
        0,
      ),
      recoveryCount: this.#recoveryIds.size,
    }
  }

  subscribe(listener: (snapshot: DownloadSnapshot) => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  enqueue(input: EnqueueDownloadInput): DownloadJob {
    const job: DownloadJob = {
      id: randomUUID(),
      ...input,
      state: 'queued',
      progress: { phase: 'queued' },
      createdAt: new Date().toISOString(),
      attempt: 0,
      stallRetries: 0,
      usedContainerFallback: false,
      usedGenericFallback: false,
    }
    this.#jobs.push(job)
    this.#changed(true)
    this.#pump()
    return structuredClone(job)
  }

  async pause(id: string): Promise<DownloadJob> {
    const job = this.#require(id)
    if (job.state === 'paused') return structuredClone(job)
    const run = this.#active.get(id)
    if (!run) throw new Error('Only an active download can be paused')
    this.#desired.set(id, 'pause')
    await run.kill()
    await this.#settling.get(id)
    return structuredClone(this.#require(id))
  }

  async cancel(id: string): Promise<DownloadJob> {
    const job = this.#require(id)
    if (job.state === 'canceled') return structuredClone(job)
    const run = this.#active.get(id)
    if (run) {
      this.#desired.set(id, 'cancel')
      await run.kill()
      await this.#settling.get(id)
    } else {
      this.#replace(transitionJob(job, 'canceled', process.env.NODE_ENV !== 'production'))
      await cleanupJobPartials(job.outputDir, job.title, job.mediaId)
      this.#changed(true)
    }
    return structuredClone(this.#require(id))
  }

  resume(id: string): DownloadJob {
    const job = this.#require(id)
    this.#recoveryIds.delete(id)
    if (job.state === 'queued') {
      this.#changed(true)
      this.#pump()
      return structuredClone(job)
    }
    const resumed = transitionJob(job, 'queued', process.env.NODE_ENV !== 'production')
    this.#replace({ ...resumed, error: undefined, finishedAt: undefined })
    this.#changed(true)
    this.#pump()
    return structuredClone(this.#require(id))
  }

  retry(id: string): DownloadJob {
    const job = this.#require(id)
    if (job.state !== 'failed' && job.state !== 'canceled')
      throw new Error('Only failed or canceled jobs can be retried')
    const queued = transitionJob(job, 'queued', process.env.NODE_ENV !== 'production')
    this.#replace({ ...queued, error: undefined, finishedAt: undefined })
    this.#changed(true)
    this.#pump()
    return structuredClone(this.#require(id))
  }

  remove(id: string): DownloadSnapshot {
    this.#require(id)
    if (this.#active.has(id)) throw new Error('An active download cannot be removed')
    this.#jobs = this.#jobs.filter((candidate) => candidate.id !== id)
    this.#recoveryIds.delete(id)
    this.#changed(true)
    return this.snapshot()
  }

  clearCompleted(): DownloadSnapshot {
    this.#jobs = this.#jobs.filter((job) => job.state !== 'completed')
    this.#changed(true)
    return this.snapshot()
  }

  setMaxConcurrent(value: number): void {
    this.#maxConcurrent = Math.max(1, Math.min(4, value))
    this.#pump()
  }

  async shutdown(): Promise<void> {
    this.#shuttingDown = true
    await Promise.all([...this.#active.keys()].map((id) => this.pause(id)))
    await Promise.allSettled(this.#settling.values())
    await this.queue.flush()
    await this.history.flush()
  }

  #pump(): void {
    if (this.#shuttingDown) return
    while (this.#active.size < this.#maxConcurrent) {
      const next = this.#jobs.find(
        (job) => job.state === 'queued' && !this.#recoveryIds.has(job.id),
      )
      if (!next) break
      this.#start(next)
    }
  }

  #start(job: DownloadJob): void {
    let current = transitionJob(job, 'starting', process.env.NODE_ENV !== 'production')
    current = { ...current, attempt: current.attempt + 1 }
    this.#replace(current)
    const run = this.engine.start(current, {
      onActivity: () => undefined,
      onProgress: (progress) => this.#onProgress(current.id, progress),
    })
    this.#active.set(current.id, run)
    this.#replace(transitionJob(current, 'downloading', process.env.NODE_ENV !== 'production'))
    this.#changed(true)
    const settling = run.completion.then((result) => this.#finish(current.id, result))
    this.#settling.set(current.id, settling)
    void settling.then(
      () => this.#settling.delete(current.id),
      (error: unknown) => {
        this.#settling.delete(current.id)
        logger.error('Download finalization failed', error)
      },
    )
  }

  #onProgress(id: string, progress: DownloadProgress): void {
    const job = this.#require(id)
    const processing = progress.phase !== 'downloading' && progress.phase !== 'queued'
    const state = processing && job.state === 'downloading' ? 'processing' : job.state
    this.#replace({ ...job, state, progress: { ...job.progress, ...progress } })
    this.#changed(false)
  }

  async #finish(id: string, result: Awaited<DownloadRun['completion']>): Promise<void> {
    const desired = this.#desired.get(id)
    this.#desired.delete(id)
    this.#active.delete(id)
    const job = this.#require(id)
    if (desired === 'pause') this.#replace(transitionJob(job, 'paused', false))
    else if (desired === 'cancel') {
      this.#replace(transitionJob(job, 'canceled', false))
      await cleanupJobPartials(job.outputDir, job.title, job.mediaId)
    } else if (result.ok) {
      const completed = completedJob(job, result.value.filePath)
      const historyItem = await this.history.append(completed)
      const withSize = historyItem
        ? { ...completed, fileSizeBytes: historyItem.fileSize }
        : completed
      this.#replace(withSize)
      this.hooks.completed(withSize)
    } else this.#replace(failedOrRetryJob(job, result.error))
    this.#changed(true)
    this.#pump()
  }

  #require(id: string): DownloadJob {
    const job = this.#jobs.find((candidate) => candidate.id === id)
    if (!job) throw new Error(`Unknown download job: ${id}`)
    return job
  }

  #replace(job: DownloadJob): void {
    this.#jobs = this.#jobs.map((candidate) => (candidate.id === job.id ? job : candidate))
  }

  #changed(immediate: boolean): void {
    this.queue.schedule(this.#jobs)
    if (immediate) this.#emit()
    else if (!this.#emitTimer) this.#emitTimer = setTimeout(() => this.#emit(), 200)
  }

  #emit(): void {
    if (this.#emitTimer) clearTimeout(this.#emitTimer)
    this.#emitTimer = undefined
    const snapshot = this.snapshot()
    for (const listener of this.#listeners) listener(snapshot)
    this.hooks.activity(snapshot)
  }
}
