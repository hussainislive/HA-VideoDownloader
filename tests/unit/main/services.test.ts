import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { firstHttpUrl } from '@main/services/clipboard'
import { cleanupJobPartials, safeFilenameStem } from '@main/services/filename'
import { describe, expect, it } from 'vitest'

describe('main process helpers', () => {
  it('extracts the first http URL from clipboard text', () => {
    expect(firstHttpUrl('See https://example.com/a?b=1 and https://other.test')).toBe(
      'https://example.com/a?b=1',
    )
    expect(firstHttpUrl('file:///private/tmp')).toBeUndefined()
  })

  it('sanitizes file stems and only removes matching partials', async () => {
    const directory = join(tmpdir(), `ha-files-${Date.now()}`)
    await mkdir(directory)
    const stem = safeFilenameStem('Bad:/Title', 'abc')
    await Promise.all([
      writeFile(join(directory, `${stem}.mp4.part`), 'partial'),
      writeFile(join(directory, `${stem}.f137.mp4`), 'fragment'),
      writeFile(join(directory, `${stem}.mp4`), 'complete'),
      writeFile(join(directory, 'unrelated.part'), 'other'),
    ])
    expect(await cleanupJobPartials(directory, 'Bad:/Title', 'abc')).toHaveLength(2)
    expect(await readdir(directory)).toEqual(
      expect.arrayContaining([`${stem}.mp4`, 'unrelated.part']),
    )
    await rm(directory, { recursive: true, force: true })
  })
})
