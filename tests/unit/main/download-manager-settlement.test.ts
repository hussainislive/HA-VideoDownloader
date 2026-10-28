import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { DownloadEngine } from '@main/downloads/contracts'
import { DownloadManager } from '@main/downloads/download-manager'
import { HistoryStore } from '@main/services/history-store'
import { QueueStore } from '@main/services/queue-store'
import { ok } from '@shared/types/result'
import { expect, it, vi } from 'vitest'

it('keeps Queue and Library synchronized when pause races with finalization', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ha-settlement-'))
  const filePath = join(directory, 'Video [video-id].mp4')
  await writeFile(filePath, Buffer.alloc(2_048))
  const history = new HistoryStore(directory)
  await history.initialize()
  const append = history.append.bind(history)
  let releaseAppend: (() => void) | undefined
  const appendGate = new Promise<void>((resolve) => {
    releaseAppend = resolve
  })
  const appendSpy = vi.spyOn(history, 'append').mockImplementation(async (job) => {
    await appendGate
    return append(job)
  })
  const engine: DownloadEngine = {
    start: () => ({
      pid: undefined,
      completion: Promise.resolve(ok({ filePath })),
      kill: async () => undefined,
    }),
  }
  const manager = new DownloadManager(new QueueStore(directory), history, engine, {
    completed: () => undefined,
    failed: () => undefined,
    activity: () => undefined,
  })
  try {
    await manager.initialize(1)
    const queued = manager.enqueue({
      url: 'https://example.test/video',
      mediaId: 'video-id',
      title: 'Video',
      platform: 'Test',
      options: {
        kind: 'video',
        quality: 1080,
        container: 'mp4',
        audioFormat: 'mp3',
        bitrate: 320,
        embedMetadata: false,
      },
      outputDir: directory,
    })
    await vi.waitFor(() => expect(appendSpy).toHaveBeenCalledOnce())
    expect(manager.snapshot().activeCount).toBe(1)
    const pause = manager.pause(queued.id)
    releaseAppend?.()
    expect((await pause).state).toBe('completed')
    expect(manager.snapshot().activeCount).toBe(0)
    expect(history.list()[0]?.filePath).toBe(filePath)
  } finally {
    releaseAppend?.()
    await manager.shutdown()
    await rm(directory, { recursive: true, force: true })
  }
})
