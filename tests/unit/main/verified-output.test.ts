import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { verifyCompletedOutput } from '@main/downloads/verified-output'
import type { DownloadJob } from '@shared/types/download'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('completed output verification', () => {
  let directory = ''
  let job: DownloadJob

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ha-output-'))
    job = {
      id: 'job',
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
      state: 'processing',
      progress: { phase: 'finalizing' },
      createdAt: new Date().toISOString(),
      attempt: 1,
      stallRetries: 0,
      usedContainerFallback: false,
      usedGenericFallback: false,
      usedCachedProbe: false,
    }
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('accepts only a nonempty final media file', async () => {
    const path = join(directory, 'Video [video-id].mp4')
    await writeFile(path, Buffer.alloc(24))
    expect(await verifyCompletedOutput(job, path)).toEqual({ path, size: 24 })
  })

  it('recovers a UTF-8 path mismatch from one matching file', async () => {
    const path = join(directory, 'Føø｜视频 [video-id].mp4')
    await writeFile(path, Buffer.alloc(24))
    expect(await verifyCompletedOutput(job, join(directory, 'F��｜�� [video-id].mp4'))).toEqual({
      path,
      size: 24,
    })
  })

  it('does not accept a file outside the selected folder', async () => {
    const outside = join(tmpdir(), 'Video [video-id].mp4')
    await expect(verifyCompletedOutput(job, outside)).rejects.toThrow('not found or is empty')
  })

  it('rejects an ambiguous pair of valid outputs', async () => {
    await writeFile(join(directory, 'Video [video-id].mp4'), 'one')
    await writeFile(join(directory, 'Other [video-id].mp4'), 'two')
    await expect(verifyCompletedOutput(job, '')).rejects.toThrow('Multiple matching')
  })
})
