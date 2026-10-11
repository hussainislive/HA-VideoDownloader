import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { HistoryStore } from '@main/services/history-store'
import { SettingsStore } from '@main/services/settings-store'
import type { DownloadJob } from '@shared/types/download'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Phase 4 persistence services', () => {
  let directory = ''

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ha-phase4-store-'))
  })

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true })
  })

  it('migrates v1 settings and persists the keep-on-top preference', async () => {
    const downloads = join(directory, 'Downloads')
    await mkdir(downloads)
    await writeFile(
      join(directory, 'settings.json'),
      JSON.stringify({
        schemaVersion: 1,
        downloadDir: join(downloads, 'HA-Downloader'),
        defaultKind: 'video',
        defaultQuality: 1080,
        defaultContainer: 'mp4',
        defaultAudioFormat: 'mp3',
        defaultAudioBitrate: 320,
        maxConcurrent: 2,
        autoPasteClipboard: true,
        notifyOnComplete: true,
        embedMetadata: true,
      }),
    )
    const store = new SettingsStore(directory, downloads)
    expect(await store.initialize()).toMatchObject({ schemaVersion: 2, keepWindowOnTop: false })
    await store.update({ keepWindowOnTop: true })
    await store.flush()
    expect(JSON.parse(await readFile(join(directory, 'settings.json'), 'utf8'))).toMatchObject({
      schemaVersion: 2,
      keepWindowOnTop: true,
    })
  })

  it('quarantines corrupt settings and restores safe defaults', async () => {
    await writeFile(join(directory, 'settings.json'), '{broken')
    const downloads = join(directory, 'Downloads')
    const store = new SettingsStore(directory, downloads)

    await expect(store.initialize()).resolves.toMatchObject({
      schemaVersion: 2,
      downloadDir: join(downloads, 'HA-Downloader'),
      maxConcurrent: 2,
    })
    await expect(access(join(downloads, 'HA-Downloader'))).resolves.toBeUndefined()
    expect(store.recoveredFromCorruption).toBe(true)
  })

  it('reports missing files and supports history-only and file deletion', async () => {
    const history = new HistoryStore(directory)
    await history.initialize()
    const existingPath = join(directory, 'existing.mp4')
    await writeFile(existingPath, 'media')
    const existing = job('00000000-0000-4000-8000-000000000001', existingPath)
    await history.append(existing)
    expect(await history.listWithStatus()).toMatchObject([{ id: existing.id, fileExists: true }])
    await rm(existingPath)
    expect(await history.listWithStatus()).toMatchObject([{ id: existing.id, fileExists: false }])

    await writeFile(existingPath, 'media')
    await history.delete(existing.id, false)
    expect(await readFile(existingPath, 'utf8')).toBe('media')

    await history.append(existing)
    await history.delete(existing.id, true)
    await expect(readFile(existingPath)).rejects.toMatchObject({ code: 'ENOENT' })
  })
})

function job(id: string, filePath: string): DownloadJob {
  return {
    id,
    url: 'https://example.test/media',
    mediaId: id,
    title: 'Media',
    platform: 'Fake',
    options: {
      kind: 'video',
      quality: 1080,
      container: 'mp4',
      audioFormat: 'mp3',
      bitrate: 320,
      embedMetadata: true,
    },
    outputDir: directoryFor(filePath),
    state: 'completed',
    progress: { phase: 'completed', percent: 100 },
    filePath,
    createdAt: '2026-10-10T00:00:00.000Z',
    finishedAt: '2026-10-10T00:01:00.000Z',
    attempt: 1,
    stallRetries: 0,
    usedContainerFallback: false,
    usedGenericFallback: false,
  }
}

function directoryFor(path: string): string {
  return path.slice(0, Math.max(1, path.lastIndexOf('/')))
}
