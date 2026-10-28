import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { DownloadEngine } from '@main/downloads/contracts'
import { DownloadManager } from '@main/downloads/download-manager'
import type { DownloadBinaryProvider } from '@main/engine/ytdlp/download'
import { YtdlpDownloadService } from '@main/engine/ytdlp/download'
import { ProbeCache } from '@main/engine/ytdlp/probe-cache'
import { HistoryStore } from '@main/services/history-store'
import { QueueStore } from '@main/services/queue-store'
import type { DownloadJob, EnqueueDownloadInput } from '@shared/types/download'
import { err, ok } from '@shared/types/result'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

async function createManager(
  directory: string,
  stallMs = 300,
  cache?: ProbeCache,
  engine?: DownloadEngine,
  historyStore?: HistoryStore,
): Promise<DownloadManager> {
  const history = historyStore ?? new HistoryStore(directory)
  await history.initialize()
  const manager = new DownloadManager(
    new QueueStore(directory),
    history,
    engine ?? new YtdlpDownloadService(provider, undefined, stallMs, cache),
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

  it('keeps a job preparing until the first real transfer progress arrives', async () => {
    const manager = await createManager(directory, 1_000)
    manager.enqueue(input(directory, 'prepare-slow'))
    expect(manager.snapshot().jobs[0]?.state).toBe('starting')
    const active = await waitFor(manager, ({ state }) => state === 'downloading')
    expect(active.progress.downloadedBytes).toBeGreaterThan(0)
    await waitFor(manager, ({ state }) => state === 'completed')
  })

  it('uses fresh probe JSON and retries the URL when cached media expires', async () => {
    const cache = new ProbeCache()
    for (const path of ['cached-only', 'cache-expired']) {
      const request = input(directory, path)
      cache.set(
        request.url,
        {
          id: request.mediaId,
          title: request.title,
          webpageUrl: request.url,
          extractor: 'Fake',
          isLive: false,
          isPlaylistEntry: false,
          formats: [],
        },
        JSON.stringify({ id: request.mediaId, title: request.title, webpage_url: request.url }),
      )
    }
    const manager = await createManager(directory, 300, cache)
    manager.enqueue(input(directory, 'cache-expired'))
    const recovered = await waitFor(manager, ({ state }) => state === 'completed')
    expect(recovered.attempt).toBe(2)
    expect(recovered.usedCachedProbe).toBe(false)
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
    const filePath = join(directory, 'Fake Video [fake-id].mp4')
    await writeFile(filePath, Buffer.alloc(2_048))
    let attempts = 0
    const engine: DownloadEngine = {
      start: () => ({
        pid: undefined,
        completion:
          ++attempts === 1
            ? Promise.resolve(
                err({
                  code: 'NETWORK_STALLED',
                  message: 'The download stopped responding.',
                  retryable: true,
                }),
              )
            : Promise.resolve(ok({ filePath })),
        kill: async () => undefined,
      }),
    }
    const manager = await createManager(directory, 300, undefined, engine)
    manager.enqueue(input(directory, 'stall'))
    const job = await waitFor(manager, ({ state }) => state === 'completed')
    expect(job.stallRetries).toBe(1)
    expect(job.attempt).toBe(2)
  })

  it.each(['missing-report', 'unicode-report', 'zero-report'])(
    'verifies the saved file when the engine path is %s',
    async (scenario) => {
      const history = new HistoryStore(directory)
      const manager = await createManager(directory, 300, undefined, undefined, history)
      manager.enqueue(input(directory, scenario))
      const job = await waitFor(manager, ({ state }) => state === 'completed')
      expect(job.filePath).toBeTruthy()
      expect((await stat(job.filePath ?? '')).size).toBeGreaterThan(0)
      expect(history.list()[0]?.filePath).toBe(job.filePath)
    },
  )

  it('fails a missing output, then allows a successful retry', async () => {
    const history = new HistoryStore(directory)
    const manager = await createManager(directory, 300, undefined, undefined, history)
    const queued = manager.enqueue(input(directory, 'missing-output'))
    const failed = await waitFor(manager, ({ state }) => state === 'failed')
    expect(failed.error?.message).toContain('could not be verified')
    expect(manager.snapshot().activeCount).toBe(0)
    expect(history.list()).toHaveLength(0)
    const output = join(directory, 'Fake Video [fake-id].mp4')
    await writeFile(output, Buffer.alloc(2_048))
    manager.retry(queued.id)
    const completed = await waitFor(manager, ({ state }) => state === 'completed')
    expect(completed.filePath).toBe(output)
    expect(history.list()).toHaveLength(1)
  })

  it('recovers when Library persistence fails during finalization', async () => {
    const history = new HistoryStore(directory)
    const append = vi.spyOn(history, 'append').mockRejectedValueOnce(new Error('disk unavailable'))
    const manager = await createManager(directory, 300, undefined, undefined, history)
    const queued = manager.enqueue(input(directory))
    await waitFor(manager, ({ state }) => state === 'failed')
    expect(manager.snapshot().activeCount).toBe(0)
    expect(history.list()).toHaveLength(0)
    manager.retry(queued.id)
    await waitFor(manager, ({ state }) => state === 'completed')
    expect(append).toHaveBeenCalledTimes(2)
    expect(history.list()).toHaveLength(1)
  })

  it('settles a rejected engine completion and can retry it', async () => {
    const filePath = join(directory, 'Fake Video [fake-id].mp4')
    await writeFile(filePath, Buffer.alloc(2_048))
    let attempts = 0
    const engine: DownloadEngine = {
      start: () => ({
        pid: undefined,
        completion:
          ++attempts === 1
            ? Promise.reject(new Error('child process failed'))
            : Promise.resolve(ok({ filePath })),
        kill: async () => undefined,
      }),
    }
    const manager = await createManager(directory, 300, undefined, engine)
    const queued = manager.enqueue(input(directory))
    await waitFor(manager, ({ state }) => state === 'failed')
    expect(manager.snapshot().activeCount).toBe(0)
    manager.retry(queued.id)
    await waitFor(manager, ({ state }) => state === 'completed')
  })

  it('falls back from MP4 to MKV after a merge failure', async () => {
    const manager = await createManager(directory)
    manager.enqueue(input(directory, 'merge-fail'))
    const job = await waitFor(manager, ({ state }) => state === 'completed')
    expect(job.options.container).toBe('mkv')
    expect(job.usedContainerFallback).toBe(true)
  })

  it('kills the engine safely when paused during a merge', async () => {
    const manager = await createManager(directory)
    const queued = manager.enqueue(input(directory, 'merge-slow'))
    await waitFor(manager, ({ state }) => state === 'processing')
    expect((await manager.pause(queued.id)).state).toBe('paused')
    expect((await readdir(directory)).some((name) => name.endsWith('.part'))).toBe(true)
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
})
