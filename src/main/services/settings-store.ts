import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { Settings, SettingsUpdate } from '@shared/types/settings'
import { z } from 'zod'

import { JsonStore } from './json-store'

const SettingsSchema = z.object({
  schemaVersion: z.literal(1),
  downloadDir: z.string(),
  defaultKind: z.enum(['video', 'audio']),
  defaultQuality: z.union([
    z.literal(480),
    z.literal(720),
    z.literal(1080),
    z.literal(1440),
    z.literal(2160),
  ]),
  defaultContainer: z.enum(['mp4', 'mkv']),
  defaultAudioFormat: z.enum(['mp3', 'm4a', 'wav']),
  defaultAudioBitrate: z.union([z.literal(128), z.literal(256), z.literal(320)]),
  maxConcurrent: z.number().int().min(1).max(4),
  autoPasteClipboard: z.boolean(),
  notifyOnComplete: z.boolean(),
  embedMetadata: z.boolean(),
})

function migrateSettings(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw
  if (!('schemaVersion' in raw)) return { ...raw, schemaVersion: 1 }
  return raw
}

export class SettingsStore {
  readonly #store: JsonStore<Settings>
  #settings?: Settings

  constructor(userData: string, downloadsPath: string) {
    const downloadDir = join(downloadsPath, 'HA-Downloader')
    this.#store = new JsonStore({
      path: join(userData, 'settings.json'),
      schema: SettingsSchema,
      migrate: migrateSettings,
      defaults: () => ({
        schemaVersion: 1,
        downloadDir,
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
      debounceMs: 300,
    })
  }

  async initialize(): Promise<Settings> {
    this.#settings = await this.#store.load()
    await mkdir(this.#settings.downloadDir, { recursive: true })
    return this.#settings
  }

  get value(): Settings {
    if (!this.#settings) throw new Error('Settings store is not initialized')
    return this.#settings
  }

  async update(update: SettingsUpdate): Promise<Settings> {
    const next = SettingsSchema.parse({ ...this.value, ...update })
    if (update.downloadDir) await mkdir(update.downloadDir, { recursive: true })
    this.#settings = next
    this.#store.schedule(next)
    return next
  }

  flush(): Promise<void> {
    return this.#store.flush()
  }
}
