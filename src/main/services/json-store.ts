import { open, readFile, rename } from 'node:fs/promises'
import { dirname } from 'node:path'

import type { z } from 'zod'

export interface JsonStoreOptions<T> {
  path: string
  schema: z.ZodType<T>
  defaults: () => T
  migrate?: (raw: unknown) => unknown
  debounceMs?: number
}

export class JsonStore<T> {
  readonly #path: string
  readonly #schema: z.ZodType<T>
  readonly #defaults: () => T
  readonly #migrate: (raw: unknown) => unknown
  readonly #debounceMs: number
  #timer: NodeJS.Timeout | undefined
  #pending: T | undefined
  #writeChain = Promise.resolve()
  #recoveredFromCorruption = false

  constructor(options: JsonStoreOptions<T>) {
    this.#path = options.path
    this.#schema = options.schema
    this.#defaults = options.defaults
    this.#migrate = options.migrate ?? ((raw) => raw)
    this.#debounceMs = options.debounceMs ?? 500
  }

  async load(): Promise<T> {
    try {
      const raw: unknown = JSON.parse(await readFile(this.#path, 'utf8'))
      const parsed = this.#schema.safeParse(this.#migrate(raw))
      if (parsed.success) return parsed.data
      await this.#quarantine()
      this.#recoveredFromCorruption = true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        await this.#quarantine()
        this.#recoveredFromCorruption = true
      }
    }
    const defaults = this.#defaults()
    await this.saveNow(defaults)
    return defaults
  }

  get recoveredFromCorruption(): boolean {
    return this.#recoveredFromCorruption
  }

  schedule(value: T): void {
    this.#pending = value
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => void this.flush(), this.#debounceMs)
  }

  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = undefined
    if (!this.#pending) return this.#writeChain
    const value = this.#pending
    this.#pending = undefined
    await this.saveNow(value)
  }

  async saveNow(value: T): Promise<void> {
    const parsed = this.#schema.parse(value)
    this.#writeChain = this.#writeChain.then(() => this.#atomicWrite(parsed))
    await this.#writeChain
  }

  async #atomicWrite(value: T): Promise<void> {
    const temporary = `${this.#path}.tmp-${process.pid}`
    const file = await open(temporary, 'w')
    try {
      await file.writeFile(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
      await file.sync()
    } finally {
      await file.close()
    }
    await rename(temporary, this.#path)
    await this.#syncDirectory()
  }

  async #syncDirectory(): Promise<void> {
    const directory = await open(dirname(this.#path), 'r').catch(() => undefined)
    if (!directory) return
    await directory.sync().catch(() => undefined)
    await directory.close()
  }

  async #quarantine(): Promise<void> {
    await rename(this.#path, `${this.#path}.corrupt-${Date.now()}`).catch(() => undefined)
  }
}
