import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { MediaInfo } from '@shared/types/media'
import { normalizeMediaUrl } from '@shared/utils/url'

const PROBE_TTL_MS = 5 * 60_000
const MAX_PROBES = 8

interface CachedProbe {
  media: MediaInfo
  json: string
  expiresAt: number
}

export interface PreparedProbe {
  path: string
  cleanup(): void
}

export class ProbeCache {
  readonly #entries = new Map<string, CachedProbe>()

  get(inputUrl: string): MediaInfo | undefined {
    const entry = this.#valid(inputUrl)
    return entry?.media
  }

  set(inputUrl: string, media: MediaInfo, json: string): void {
    const url = normalizeMediaUrl(inputUrl)
    if (!url) return
    this.#entries.delete(url)
    this.#entries.set(url, { media, json, expiresAt: Date.now() + PROBE_TTL_MS })
    while (this.#entries.size > MAX_PROBES) {
      const oldest = this.#entries.keys().next().value
      if (!oldest) break
      this.#entries.delete(oldest)
    }
  }

  prepare(inputUrl: string, mediaId: string): PreparedProbe | undefined {
    const entry = this.#valid(inputUrl)
    if (!entry || entry.media.id !== mediaId) return undefined
    let directory: string | undefined
    try {
      const created = mkdtempSync(join(tmpdir(), 'ha-probe-'))
      directory = created
      const path = join(created, 'info.json')
      writeFileSync(path, entry.json, { mode: 0o600 })
      return { path, cleanup: () => rmSync(created, { recursive: true, force: true }) }
    } catch {
      if (directory) rmSync(directory, { recursive: true, force: true })
      return undefined
    }
  }

  #valid(inputUrl: string): CachedProbe | undefined {
    const url = normalizeMediaUrl(inputUrl)
    if (!url) return undefined
    const entry = this.#entries.get(url)
    if (entry && entry.expiresAt > Date.now()) return entry
    this.#entries.delete(url)
    return undefined
  }
}
