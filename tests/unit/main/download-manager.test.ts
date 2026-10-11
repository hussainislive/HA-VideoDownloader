import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { DownloadManager } from '@main/downloads/download-manager'
import type { DownloadBinaryProvider } from '@main/engine/ytdlp/download'
import { YtdlpDownloadService } from '@main/engine/ytdlp/download'
import { HistoryStore } from '@main/services/history-store'
import { QueueStore } from '@main/services/queue-store'
import type { DownloadJob, EnqueueDownloadInput } from '@shared/types/download'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const fakeScript = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
const provider: DownloadBinaryProvider = {
  paths: { ffmpeg: '/bin/true' },
  ytdlpInvocation: (args) => ({ file: process.execPath, args: [fakeScript, ...args] }),
}
let latestManager: DownloadManager | undefined

function input(outputDir: string, path = 'ok'): EnqueueDownloadInput {
  return {
    url: `https://example.test/${path}`,
    mediaId: 'fake-id',
    title: 'Fake Video',
    platform: 'Fake',
    durationSec: 10,
    options: {
      kind: 'video',
      quality: 480,
      container: 'mp4',
      audioFormat: 'mp3',
      bitrate: 320,
      embedMetadata: true,
    },
    outputDir,
  }
}

async function waitFor(
  manager: DownloadManager,
  predicate: (job: DownloadJob) => boolean,
  timeout = 5_000,
): Promise<DownloadJob> {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const job = manager.snapshot().jobs[0]
    if (job && predicate(job)) return job
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('Timed out waiting for job state')
}

async function createManager(directory: string, stallMs = 300): Promise<DownloadManager> {
  const history = new HistoryStore(directory)
  await history.initialize()
  const manager = new DownloadManager(
    new QueueStore(directory),
    history,
    new YtdlpDownloadService(provider, undefined, stallMs),
    { completed: () => undefined, failed: () => undefined, activity: () => undefined },
  )
  await manager.initialize(2)
  latestManager = manager
  return manager
}

describe('DownloadManager with the deterministic engine', () => {
  let directory = ''

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ha-manager-'))
  })

  afterEach(async () => {
    await latestManager?.shutdown()
    latestManager = undefined
    await rm(directory, { recursive: true, force: true })
  })

  it('completes a download and records its real file', async () => {
    const manager = await createManager(directory)
    manager.enqueue(input(directory))
    const job = await waitFor(manager, ({ state }) => state === 'completed')
    expect(job.filePath).toBeTruthy()
    expect(job.fileSizeBytes).toBe((await stat(job.filePath ?? '')).size)
    expect(await readdir(directory)).toContain('Fake Video [fake-id].mp4')
  })

  it('drops completed queue cards after restart while history remains authoritative', async () => {
    const manager = await createManager(directory)
    manager.enqueue(input(directory))
    await waitFor(manager, ({ state }) => state === 'completed')
    await manager.shutdown()
    const relaunched = await createManager(directory)
    expect(relaunched.snapshot().jobs).toEqual([])
  })

  it('treats an existing complete file as completed', async () => {
    const manager = await createManager(directory)
    manager.enqueue(input(directory, 'existing'))
    const job = await waitFor(manager, ({ state }) => state === 'completed')
    expect(job.filePath).toContain('Fake Video [fake-id].mp4')
  })

  it('pauses, keeps the partial, then resumes to completion', async () => {
    const manager = await createManager(directory)
    const queued = manager.enqueue(input(directory, 'slow'))
    await waitFor(manager, (job) => job.state === 'downloading' && (job.progress.percent ?? 0) > 0)
    expect((await manager.pause(queued.id)).state).toBe('paused')
    expect(manager.snapshot().aggregateSpeedBps).toBe(0)
    expect((await readdir(directory)).some((name) => name.endsWith('.part'))).toBe(true)
    manager.resume(queued.id)
    await waitFor(manager, ({ state }) => state === 'completed')
  })

  it('cancels idempotently and deletes only its partial', async () => {
    const manager = await createManager(directory)
    const queued = manager.enqueue(input(directory, 'slow'))
    await waitFor(manager, (job) => job.state === 'downloading')
    expect((await manager.cancel(queued.id)).state).toBe('canceled')
    expect((await manager.cancel(queued.id)).state).toBe('canceled')
    expect((await readdir(directory)).some((name) => name.endsWith('.part'))).toBe(false)
  })

  it('auto-retries one stall and completes', async () => {
    const manager = await createManager(directory, 100)
    manager.enqueue(input(directory, 'stall'))
    const job = await waitFor(manager, ({ state }) => state === 'completed', 8_000)
    expect(job.stallRetries).toBe(1)
    expect(job.attempt).toBe(2)
  })

  it('falls back from MP4 to MKV after a merge failure', async () => {
    const manager = await createManager(directory)
    manager.enqueue(input(directory, 'merge-fail'))
    const job = await waitFor(manager, ({ state }) => state === 'completed')
    expect(job.options.container).toBe('mkv')
    expect(job.usedContainerFallback).toBe(true)
  })

  it('falls back to generic selectors when a probed format ID expires', async () => {
    const manager = await createManager(directory)
    const request = input(directory, 'format-fail')
    manager.enqueue({ ...request, options: { ...request.options, videoFormatId: 'expired' } })
    const job = await waitFor(manager, ({ state }) => state === 'completed')
    expect(job.usedGenericFallback).toBe(true)
  })

  it.each([
    ['crash', 'UNKNOWN'],
    ['disk-full', 'DISK_FULL'],
  ])('maps a %s failure', async (path, code) => {
    const manager = await createManager(directory)
    manager.enqueue(input(directory, path))
    const job = await waitFor(manager, ({ state }) => state === 'failed')
    expect(job.error?.code).toBe(code)
  })

  it('counts each manual retry as exactly one new attempt', async () => {
    const manager = await createManager(directory)
    const queued = manager.enqueue(input(directory, 'crash'))
    expect((await waitFor(manager, ({ state }) => state === 'failed')).attempt).toBe(1)
    manager.retry(queued.id)
    const retried = await waitFor(manager, (job) => job.state === 'failed' && job.attempt === 2)
    expect(retried.attempt).toBe(2)
  })

  it('never exceeds maxConcurrent with 50 queued jobs', async () => {
    const manager = await createManager(directory)
    let peak = 0
    manager.subscribe(({ activeCount }) => {
      peak = Math.max(peak, activeCount)
    })
    for (let index = 0; index < 50; index += 1) {
      manager.enqueue(input(join(directory, `job-${index}`), `ok-${index}`))
    }
    const started = Date.now()
    while (manager.snapshot().jobs.some(({ state }) => state !== 'completed')) {
      if (Date.now() - started > 15_000) throw new Error('Queue did not drain')
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    expect(peak).toBe(2)
  }, 20_000)
})
