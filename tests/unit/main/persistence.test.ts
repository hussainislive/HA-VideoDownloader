import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { JsonStore } from '@main/services/json-store'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

const Schema = z.object({ schemaVersion: z.literal(2), name: z.string() })

describe('JsonStore', () => {
  let directory = ''

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ha-store-'))
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('migrates and atomically persists data', async () => {
    const path = join(directory, 'store.json')
    await writeFile(path, JSON.stringify({ schemaVersion: 1, oldName: 'migrated' }))
    const store = new JsonStore({
      path,
      schema: Schema,
      defaults: () => ({ schemaVersion: 2, name: 'default' }),
      migrate: (raw) => {
        const legacy = raw as { schemaVersion?: number; oldName?: string }
        return legacy.schemaVersion === 1 ? { schemaVersion: 2, name: legacy.oldName } : raw
      },
      debounceMs: 5,
    })
    expect(await store.load()).toEqual({ schemaVersion: 2, name: 'migrated' })
    store.schedule({ schemaVersion: 2, name: 'saved' })
    await store.flush()
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ schemaVersion: 2, name: 'saved' })
  })

  it('quarantines corrupt data and restores defaults', async () => {
    const path = join(directory, 'store.json')
    await writeFile(path, '{broken')
    const store = new JsonStore({
      path,
      schema: Schema,
      defaults: () => ({ schemaVersion: 2, name: 'safe' }),
    })
    expect(await store.load()).toEqual({ schemaVersion: 2, name: 'safe' })
    expect((await readdir(directory)).some((name) => name.startsWith('store.json.corrupt-'))).toBe(
      true,
    )
  })
})
