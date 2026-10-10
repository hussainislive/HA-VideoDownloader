import { EngineUpdater } from '@main/engine/updater'
import type { EngineStatus } from '@shared/types/engine'
import { describe, expect, it, vi } from 'vitest'

function engineStatus(version?: string): EngineStatus {
  return {
    ytdlp: {
      found: version !== undefined,
      path: '/engine/yt-dlp',
      ...(version ? { version } : {}),
    },
    ffmpeg: { found: true, version: 'ffmpeg 8.0', path: '/engine/ffmpeg' },
    arch: 'arm64',
    ok: version !== undefined,
  }
}

describe('EngineUpdater', () => {
  it('reports an updated writable engine after a successful update', async () => {
    const binaries = {
      status: engineStatus('2026.01.01'),
      ytdlpInvocation: vi.fn(() => ({ file: '/engine/yt-dlp', args: ['-U'] })),
      refreshStatus: vi.fn(async () => engineStatus('2026.02.01')),
      restoreBundledCopy: vi.fn(async () => undefined),
    }
    const runner = {
      run: vi.fn(async () => ({ code: 0, signal: null, stdout: '', stderr: '' })),
    }

    await expect(new EngineUpdater(binaries, runner).checkAndUpdate()).resolves.toEqual({
      ok: true,
      value: { before: '2026.01.01', after: '2026.02.01', updated: true },
    })
    expect(runner.run).toHaveBeenCalledWith('/engine/yt-dlp', ['-U'], { timeoutMs: 90_000 })
    expect(binaries.restoreBundledCopy).not.toHaveBeenCalled()
  })

  it('restores the bundled engine when a successful updater leaves an invalid copy', async () => {
    const binaries = {
      status: engineStatus('2026.01.01'),
      ytdlpInvocation: vi.fn(() => ({ file: '/engine/yt-dlp', args: ['-U'] })),
      refreshStatus: vi
        .fn<() => Promise<EngineStatus>>()
        .mockResolvedValueOnce(engineStatus())
        .mockResolvedValueOnce(engineStatus('2026.01.01')),
      restoreBundledCopy: vi.fn(async () => undefined),
    }
    const runner = {
      run: vi.fn(async () => ({ code: 0, signal: null, stdout: '', stderr: '' })),
    }

    const result = await new EngineUpdater(binaries, runner).checkAndUpdate()
    expect(result).toMatchObject({ ok: false, error: { code: 'ENGINE_UPDATE_FAILED' } })
    expect(binaries.restoreBundledCopy).toHaveBeenCalledOnce()
    expect(binaries.refreshStatus).toHaveBeenCalledTimes(2)
  })

  it('never returns raw updater stderr and repairs a broken copy on failure', async () => {
    const secretStderr = 'failed URL https://example.com/watch?secret=token'
    const binaries = {
      status: engineStatus('2026.01.01'),
      ytdlpInvocation: vi.fn(() => ({ file: '/engine/yt-dlp', args: ['-U'] })),
      refreshStatus: vi
        .fn<() => Promise<EngineStatus>>()
        .mockResolvedValueOnce(engineStatus())
        .mockResolvedValueOnce(engineStatus('2026.01.01')),
      restoreBundledCopy: vi.fn(async () => undefined),
    }
    const runner = {
      run: vi.fn(async () => ({ code: 1, signal: null, stdout: '', stderr: secretStderr })),
    }

    const result = await new EngineUpdater(binaries, runner).checkAndUpdate()
    expect(result).toMatchObject({ ok: false, error: { code: 'ENGINE_UPDATE_FAILED' } })
    expect(result.ok || result.error.detail).not.toContain(secretStderr)
    expect(binaries.restoreBundledCopy).toHaveBeenCalledOnce()
  })
})
