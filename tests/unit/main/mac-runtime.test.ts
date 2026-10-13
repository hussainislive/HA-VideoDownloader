import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { MacRuntime } from '@main/engine/mac-runtime'
import { afterEach, describe, expect, it } from 'vitest'

const created: string[] = []

afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

async function sourceRuntime(root: string, version: string): Promise<string> {
  const source = join(root, 'bundled')
  await mkdir(source)
  await writeFile(join(source, '.ha-version'), `${version}\n`)
  await writeFile(join(source, 'yt-dlp_macos'), version)
  await chmod(join(source, 'yt-dlp_macos'), 0o755)
  return source
}

describe('writable macOS runtime', () => {
  it('installs once, reuses the copy, and selects a newer verified version', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ha-mac-runtime-test-'))
    created.push(root)
    const bundled = await sourceRuntime(root, '2026.08.19')
    const runtime = new MacRuntime(join(root, 'userData'))
    const first = await runtime.prepare(bundled)
    expect(await readFile(first, 'utf8')).toBe('2026.08.19')
    await writeFile(first, 'still-installed')
    expect(await runtime.prepare(bundled)).toBe(first)
    expect(await readFile(first, 'utf8')).toBe('still-installed')

    const newer = join(root, 'userData', 'engine', 'mac-runtime', '2026.09.01')
    await mkdir(newer)
    await writeFile(join(newer, '.ha-version'), '2026.09.01\n')
    await writeFile(join(newer, 'yt-dlp_macos'), 'newer')
    await chmod(join(newer, 'yt-dlp_macos'), 0o755)
    expect(await runtime.currentExecutable('2026.08.19')).toBe(join(newer, 'yt-dlp_macos'))
  })
})
