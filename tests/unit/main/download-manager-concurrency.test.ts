import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { DownloadEngine } from '@main/downloads/contracts'
import { DownloadManager } from '@main/downloads/download-manager'
import { HistoryStore } from '@main/services/history-store'
import { QueueStore } from '@main/services/queue-store'
import type { EnqueueDownloadInput } from '@shared/types/download'
import { ok } from '@shared/types/result'
import { expect, it } from 'vitest'

it('never exceeds maxConcurrent with 50 queued jobs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ha-concurrency-'))
  const history = new HistoryStore(directory)
  const engine: DownloadEngine = {
    start: (job) => ({
      pid: undefined,
      completion: Promise.resolve(
        ok({ filePath: join(job.outputDir, 'Fake Video [fake-id].mp4') }),
      ),
      kill: async () => undefined,
    }),
  }
  const manager = new DownloadManager(new QueueStore(directory), history, engine, {
    completed: () => undefined,
    failed: () => undefined,
    activity: () => undefined,
  })
  try {
    await history.initialize()
    await manager.initialize(2)
    let peak = 0
    manager.subscribe(({ activeCount }) => {
      peak = Math.max(peak, activeCount)
    })
    const requests: EnqueueDownloadInput[] = []
    for (let index = 0; index < 50; index += 1) {
      const outputDir = join(directory, `job-${index}`)
      await mkdir(outputDir)
      await writeFile(join(outputDir, 'Fake Video [fake-id].mp4'), Buffer.alloc(2_048))
      requests.push({
        url: `https://example.test/ok-${index}`,
        mediaId: 'fake-id',
        title: 'Fake Video',
        platform: 'Fake',
        options: {
          kind: 'video',
          quality: 480,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: false,
        },
        outputDir,
      })
    }
    for (const request of requests) manager.enqueue(request)
    const started = Date.now()
    while (manager.snapshot().jobs.some(({ state }) => state !== 'completed')) {
      if (Date.now() - started > 5_000) throw new Error('Queue did not drain')
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    expect(peak).toBe(2)
  } finally {
    await manager.shutdown()
    await rm(directory, { recursive: true, force: true })
  }
})
