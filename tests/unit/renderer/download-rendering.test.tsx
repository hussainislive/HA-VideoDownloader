import { useDownloadStore } from '@renderer/store/download-store'
import type { DownloadJob } from '@shared/types/download'
import { act, render } from '@testing-library/react'
import { Profiler } from 'react'
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

function JobSubscriber({ id }: { id: string }): null {
  useDownloadStore((state) => state.jobsById[id])
  return null
}

describe('per-job renderer subscriptions', () => {
  it('re-renders only the card whose job changed', () => {
    const first = job('first', 10)
    const second = job('second', 10)
    useDownloadStore.getState().applySnapshot({
      jobs: [first, second],
      activeCount: 2,
      aggregateSpeedBps: 0,
      recoveryCount: 0,
    })
    const updates = { first: 0, second: 0 }
    render(
      <>
        <Profiler
          id="first"
          onRender={(id, phase) => {
            if (phase === 'update') updates[id as keyof typeof updates] += 1
          }}
        >
          <JobSubscriber id="first" />
        </Profiler>
        <Profiler
          id="second"
          onRender={(id, phase) => {
            if (phase === 'update') updates[id as keyof typeof updates] += 1
          }}
        >
          <JobSubscriber id="second" />
        </Profiler>
      </>,
    )

    act(() => {
      useDownloadStore.getState().applySnapshot({
        jobs: [{ ...first, progress: { ...first.progress, percent: 20 } }, structuredClone(second)],
        activeCount: 2,
        aggregateSpeedBps: 0,
        recoveryCount: 0,
      })
    })

    expect(updates).toEqual({ first: 1, second: 0 })
  })
})
