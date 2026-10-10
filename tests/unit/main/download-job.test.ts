import { canTransition, recoverJobs, transitionJob } from '@main/downloads/job'
import type { DownloadJob } from '@shared/types/download'
import { describe, expect, it } from 'vitest'

const job: DownloadJob = {
  id: 'b530e288-e9bd-47ec-abf6-a6839a22f59b',
  url: 'https://example.com/ok',
  mediaId: 'ok',
  title: 'Video',
  platform: 'Test',
  options: {
    kind: 'video',
    quality: 480,
    container: 'mp4',
    audioFormat: 'mp3',
    bitrate: 320,
    embedMetadata: true,
  },
  outputDir: '/tmp',
  state: 'queued',
  progress: { phase: 'queued' },
  createdAt: '2026-01-01T00:00:00.000Z',
  attempt: 0,
  stallRetries: 0,
  usedContainerFallback: false,
  usedGenericFallback: false,
}

describe('download state machine', () => {
  it('allows the intended happy path', () => {
    expect(canTransition('queued', 'starting')).toBe(true)
    expect(transitionJob(job, 'starting').state).toBe('starting')
    expect(canTransition('completed', 'queued')).toBe(false)
  })

  it('throws for illegal transitions in strict mode', () => {
    expect(() => transitionJob(job, 'completed')).toThrow('queued -> completed')
    expect(transitionJob(job, 'completed', false)).toBe(job)
  })

  it('recovers active jobs as paused and holds queued jobs', () => {
    const active = {
      ...job,
      id: '28204c25-358b-4e0d-85ea-13807c8b2536',
      state: 'downloading' as const,
    }
    const paused = { ...job, id: '4d9d56cf-cbf5-48dd-a61c-25104992fb0f', state: 'paused' as const }
    const result = recoverJobs([job, active, paused])
    expect(result.jobs.map(({ state }) => state)).toEqual(['queued', 'paused', 'paused'])
    expect(result.recoveryIds.size).toBe(3)
  })
})
