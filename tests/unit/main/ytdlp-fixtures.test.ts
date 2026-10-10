import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { mapEngineError } from '@main/engine/ytdlp/errors'
import { availableQualityTiers } from '@main/engine/ytdlp/formats'
import { parseProbeJson } from '@main/engine/ytdlp/probe'
import { describe, expect, it } from 'vitest'

const fixtureRoot = join(process.cwd(), 'tests/fixtures/ytdlp')

async function fixture(name: string): Promise<string> {
  return readFile(join(fixtureRoot, name), 'utf8')
}

describe('captured yt-dlp fixtures', () => {
  it('parses landscape, vertical, and audio-only metadata', async () => {
    const landscape = parseProbeJson(
      await fixture('landscape.json'),
      'https://commons.wikimedia.org',
    )
    const vertical = parseProbeJson(await fixture('vertical.json'), 'https://commons.wikimedia.org')
    const audio = parseProbeJson(await fixture('audio-only.json'), 'https://commons.wikimedia.org')
    expect(landscape.ok && landscape.value.formats.length).toBeGreaterThan(0)
    expect(vertical.ok && availableQualityTiers(vertical.value.formats)).toContain(1080)
    expect(audio.ok && audio.value.formats.some(({ acodec }) => acodec && acodec !== 'none')).toBe(
      true,
    )
  })

  it.each([
    ['unavailable.stderr.txt', 'VIDEO_UNAVAILABLE'],
    ['unsupported.stderr.txt', 'UNSUPPORTED_URL'],
    ['offline.stderr.txt', 'NETWORK_OFFLINE'],
  ])('maps %s to %s', async (name, code) => {
    expect(mapEngineError(await fixture(name)).code).toBe(code)
  })
})
