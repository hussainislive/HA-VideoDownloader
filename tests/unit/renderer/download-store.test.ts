import { useDownloadStore } from '@renderer/store/download-store'
import type { DownloadJob } from '@shared/types/download'
import { describe, expect, it } from 'vitest'

function job(id: string, percent: number): DownloadJob {
  return {
    id,
    url: `https://example.test/${id}`,
    mediaId: id,
    title: id,
    platform: 'Example',
    options: {
      kind: 'video',
      quality: 1080,
      container: 'mp4',
      audioFormat: 'mp3',
      bitrate: 320,
      embedMetadata: true,
    },
    outputDir: '/tmp',
    state: 'downloading',
    progress: { phase: 'downloading', percent },
    createdAt: '2026-01-01T00:00:00.000Z',
    attempt: 1,
    stallRetries: 0,
    usedContainerFallback: false,
    usedGenericFallback: false,
  }
}

describe('download store reconciliation', () => {
  it('preserves untouched job identity so unrelated cards do not re-render', () => {
    const first = job('first', 10)
    const second = job('second', 10)
    const apply = useDownloadStore.getState().applySnapshot
    apply({ jobs: [first, second], activeCount: 2, aggregateSpeedBps: 0, recoveryCount: 0 })
    const before = useDownloadStore.getState().jobsById.second
    apply({
      jobs: [{ ...first, progress: { ...first.progress, percent: 20 } }, structuredClone(second)],
      activeCount: 2,
      aggregateSpeedBps: 0,
      recoveryCount: 0,
    })
    expect(useDownloadStore.getState().jobsById.second).toBe(before)
    expect(useDownloadStore.getState().jobsById.first).not.toBe(first)
  })
})
