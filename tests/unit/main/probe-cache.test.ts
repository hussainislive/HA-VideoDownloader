import { readFileSync, statSync } from 'node:fs'

import { ProbeCache } from '@main/engine/ytdlp/probe-cache'
import type { MediaInfo } from '@shared/types/media'
import { afterEach, describe, expect, it, vi } from 'vitest'

const url = 'https://example.test/video'
const media: MediaInfo = {
  id: 'video-1',
  title: 'Video',
  webpageUrl: url,
  extractor: 'Example',
  isLive: false,
  isPlaylistEntry: false,
  formats: [],
}
const json = JSON.stringify({ id: 'video-1', title: 'Video', webpage_url: url })

describe('short-lived probe data', () => {
  afterEach(() => vi.useRealTimers())

  it('reuses only a matching, fresh probe and removes its private temporary file', () => {
    const cache = new ProbeCache()
    cache.set(url, media, json)
    expect(cache.prepare(url, 'other-id')).toBeUndefined()
    const prepared = cache.prepare(url, 'video-1')
    expect(prepared).toBeDefined()
    if (!prepared) throw new Error('Probe data was not prepared')
    expect(readFileSync(prepared.path, 'utf8')).toBe(json)
    if (process.platform !== 'win32') expect(statSync(prepared.path).mode & 0o777).toBe(0o600)
    prepared.cleanup()
    expect(() => statSync(prepared.path)).toThrow()
  })

  it('expires probe data after five minutes', () => {
    vi.useFakeTimers()
    const cache = new ProbeCache()
    cache.set(url, media, json)
    vi.advanceTimersByTime(5 * 60_000 + 1)
    expect(cache.get(url)).toBeUndefined()
    expect(cache.prepare(url, 'video-1')).toBeUndefined()
  })
})
