import { join } from 'node:path'

import type { DownloadJob } from '@shared/types/download'
import { z } from 'zod'

import { JsonStore } from './json-store'
import { DownloadJobSchema } from './schemas'

const QueueSchema = z.object({ schemaVersion: z.literal(1), jobs: z.array(DownloadJobSchema) })
type QueueDocument = z.infer<typeof QueueSchema>

export class QueueStore {
  readonly #store: JsonStore<QueueDocument>

  constructor(userData: string) {
    this.#store = new JsonStore({
      path: join(userData, 'queue.json'),
      schema: QueueSchema,
      defaults: () => ({ schemaVersion: 1, jobs: [] }),
    })
  }

  async load(): Promise<DownloadJob[]> {
    return (await this.#store.load()).jobs
  }

  schedule(jobs: readonly DownloadJob[]): void {
    this.#store.schedule({ schemaVersion: 1, jobs: [...structuredClone(jobs)] })
  }

  flush(): Promise<void> {
    return this.#store.flush()
  }
}
