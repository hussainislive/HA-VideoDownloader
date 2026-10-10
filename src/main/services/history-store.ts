import { access, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'

import type { DownloadJob } from '@shared/types/download'
import type { HistoryItem, LibrarySearchInput } from '@shared/types/history'
import { z } from 'zod'

import { JsonStore } from './json-store'
import { HistoryItemSchema } from './schemas'

const HistorySchema = z.object({ schemaVersion: z.literal(1), items: z.array(HistoryItemSchema) })
type HistoryDocument = z.infer<typeof HistorySchema>

export class HistoryStore {
  readonly #store: JsonStore<HistoryDocument>
  #items: HistoryItem[] = []

  constructor(userData: string) {
    this.#store = new JsonStore({
      path: join(userData, 'history.json'),
      schema: HistorySchema,
      defaults: () => ({ schemaVersion: 1, items: [] }),
    })
  }

  async initialize(): Promise<void> {
    this.#items = (await this.#store.load()).items
  }

  list(): HistoryItem[] {
    return structuredClone(this.#items)
  }

  search(input: LibrarySearchInput): HistoryItem[] {
    const query = input.query.trim().toLocaleLowerCase()
    return this.list().filter((item) => {
      const matchesKind = !input.kind || item.options.kind === input.kind
      const haystack = `${item.title} ${item.uploader ?? ''} ${item.platform}`.toLocaleLowerCase()
      return matchesKind && haystack.includes(query)
    })
  }

  async append(job: DownloadJob): Promise<HistoryItem | undefined> {
    if (!job.filePath) return undefined
    const file = await stat(job.filePath)
    const item: HistoryItem = {
      id: job.id,
      url: job.url,
      title: job.title,
      ...(job.uploader ? { uploader: job.uploader } : {}),
      ...(job.thumbnailUrl ? { thumbnailUrl: job.thumbnailUrl } : {}),
      platform: job.platform,
      options: job.options,
      filePath: job.filePath,
      fileSize: file.size,
      ...(job.durationSec !== undefined ? { durationSec: job.durationSec } : {}),
      completedAt: job.finishedAt ?? new Date().toISOString(),
    }
    this.#items = [item, ...this.#items.filter(({ id }) => id !== item.id)].slice(0, 5_000)
    this.#store.schedule({ schemaVersion: 1, items: this.#items })
    return item
  }

  async delete(id: string, deleteFile: boolean): Promise<HistoryItem[]> {
    const item = this.#items.find((candidate) => candidate.id === id)
    if (
      deleteFile &&
      item &&
      (await access(item.filePath).then(
        () => true,
        () => false,
      ))
    ) {
      await rm(item.filePath)
    }
    this.#items = this.#items.filter((candidate) => candidate.id !== id)
    this.#store.schedule({ schemaVersion: 1, items: this.#items })
    return this.list()
  }

  flush(): Promise<void> {
    return this.#store.flush()
  }
}
