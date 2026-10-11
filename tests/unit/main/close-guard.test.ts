import { activeDownloadCount } from '@main/window/close-guard'
import type { DownloadJob, DownloadSnapshot } from '@shared/types/download'
import { describe, expect, it } from 'vitest'

describe('activeDownloadCount', () => {
  it('counts only jobs that must be paused before closing', () => {
    const snapshot = {
      jobs: (
        ['queued', 'starting', 'downloading', 'processing', 'paused', 'completed'] as const
      ).map((state, index) => job(state, String(index))),
      activeCount: 3,
      aggregateSpeedBps: 0,
      recoveryCount: 0,
    } satisfies DownloadSnapshot
    expect(activeDownloadCount(snapshot)).toBe(3)
    expect(activeDownloadCount(undefined)).toBe(0)
  })
})

function job(state: DownloadJob['state'], id: string): DownloadJob {
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
    outputDir: '/tmp',
    state,
    progress: { phase: 'queued' },
    createdAt: '2026-10-10T00:00:00.000Z',
    attempt: 0,
    stallRetries: 0,
    usedContainerFallback: false,
    usedGenericFallback: false,
  }
}
