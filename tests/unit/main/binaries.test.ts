import { join } from 'node:path'

import {
  binaryFolderFor,
  packagedBinaryRoot,
  resolveBundledBinaryPaths,
} from '@main/engine/binaries'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('architecture-specific binary resolution', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves packaged binaries below the resources binaries directory', () => {
    expect(packagedBinaryRoot('/Applications/HA.app/Contents/Resources')).toBe(
      '/Applications/HA.app/Contents/Resources/binaries',
    )
  })

  it('selects the native Apple Silicon folder from process.arch', async () => {
    vi.spyOn(process, 'arch', 'get').mockReturnValue('arm64')
    const pathExists = vi.fn(async () => true)

    const result = await resolveBundledBinaryPaths('/app/binaries', 'darwin', undefined, pathExists)

    expect(binaryFolderFor('darwin')).toBe('macos-arm64')
    expect(result).toEqual({
      ok: true,
      value: {
        folder: 'macos-arm64',
        ytdlp: join('/app/binaries', 'macos-arm64', 'yt-dlp'),
        ffmpeg: join('/app/binaries', 'macos-arm64', 'ffmpeg'),
      },
    })
  })

  it('selects the Intel folder from process.arch', async () => {
    vi.spyOn(process, 'arch', 'get').mockReturnValue('x64')
    const pathExists = vi.fn(async () => true)

    const result = await resolveBundledBinaryPaths('/app/binaries', 'darwin', undefined, pathExists)

    expect(binaryFolderFor('darwin')).toBe('macos-x64')
    expect(result.ok && result.value.folder).toBe('macos-x64')
  })

  it('reports ENGINE_NOT_FOUND when the matching architecture folder is incomplete', async () => {
    vi.spyOn(process, 'arch', 'get').mockReturnValue('arm64')
    const pathExists = vi.fn(async (path: string) => !path.endsWith('ffmpeg'))

    const result = await resolveBundledBinaryPaths('/app/binaries', 'darwin', undefined, pathExists)

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'ENGINE_NOT_FOUND',
        message: expect.stringContaining('macOS arm64'),
      },
    })
  })
})
