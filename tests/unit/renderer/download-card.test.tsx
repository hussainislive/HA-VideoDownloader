import { ToastProvider } from '@renderer/components/ui/Toast'
import { DownloadCard } from '@renderer/features/queue/components/DownloadCard'
import { useDownloadStore } from '@renderer/store/download-store'
import type { HaApi } from '@shared/ipc/api'
import type { DownloadJob, DownloadState } from '@shared/types/download'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const writeText = vi.fn().mockResolvedValue({ ok: true, value: undefined })

function job(state: DownloadState): DownloadJob {
  return {
    id: '3f551c93-577d-46f8-9711-0f3bc5395c64',
    url: 'https://example.test/video',
    mediaId: 'fake-id',
    title: 'Test download',
    platform: 'Example',
    options: {
      kind: 'video',
      quality: 1080,
      container: 'mp4',
      audioFormat: 'mp3',
      bitrate: 320,
      embedMetadata: true,
    },
    outputDir: '/tmp',
    state,
    progress: {
      phase:
        state === 'processing' ? 'merging' : state === 'completed' ? 'completed' : 'downloading',
      percent: state === 'completed' ? 100 : 25,
      downloadedBytes: 250,
      totalBytes: 1_000,
      speedBps: 500,
      etaSec: 5,
    },
    ...(state === 'completed' ? { filePath: '/tmp/video.mp4' } : {}),
    ...(state === 'failed'
      ? { error: { code: 'UNKNOWN' as const, message: 'Download failed.', retryable: true } }
      : {}),
    createdAt: '2026-01-01T00:00:00.000Z',
    attempt: 1,
    stallRetries: 0,
    usedContainerFallback: false,
    usedGenericFallback: false,
  }
}

function show(state: DownloadState): void {
  useDownloadStore.getState().applySnapshot({
    jobs: [job(state)],
    activeCount: 0,
    aggregateSpeedBps: 0,
    recoveryCount: 0,
  })
  render(
    <ToastProvider>
      <DownloadCard id="3f551c93-577d-46f8-9711-0f3bc5395c64" />
    </ToastProvider>,
  )
}

describe('DownloadCard', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'api', {
      configurable: true,
      value: {
        clipboard: { writeText },
        downloads: {
          cancel: vi.fn(),
          pause: vi.fn(),
          remove: vi.fn(),
          resume: vi.fn(),
          retry: vi.fn(),
        },
        engine: { checkUpdate: vi.fn() },
        library: { delete: vi.fn() },
        shell: { openFile: vi.fn(), showInFolder: vi.fn() },
      } as unknown as HaApi,
    })
  })

  it.each([
    ['queued', 'Queued · #1'],
    ['starting', 'Preparing source…'],
    ['downloading', 'Downloading'],
    ['processing', 'Merging video + audio…'],
    ['paused', 'Paused'],
    ['completed', 'Completed'],
    ['failed', 'Failed'],
    ['canceled', 'Canceled'],
  ] as const)('renders the %s variant', (state, label) => {
    show(state)
    expect(screen.getAllByText(label).length).toBeGreaterThan(0)
  })

  it('offers file actions for a completed download', () => {
    show('completed')
    expect(screen.getByRole('button', { name: 'Open Folder' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Quick Play' })).toBeEnabled()
  })

  it('portals the completed actions menu outside the download card', async () => {
    const user = userEvent.setup()
    show('completed')
    const trigger = screen.getByRole('button', { name: 'More actions' })

    await user.click(trigger)

    const menu = screen.getByRole('menu', { name: 'More actions' })
    expect(menu.parentElement).toBe(document.body)
    expect(menu.closest('[data-job-id]')).toBeNull()
    expect(menu).toHaveClass('fixed', 'z-50')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('copies a completed download link and confirms it', async () => {
    const user = userEvent.setup()
    show('completed')
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Copy link' }))
    expect(writeText).toHaveBeenCalledWith('https://example.test/video')
    expect(await screen.findByText('Link copied')).toBeVisible()
  })

  it('portals delete confirmation outside the download card', async () => {
    const user = userEvent.setup()
    show('completed')
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete file' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete this downloaded file?' })
    expect(dialog.parentElement?.parentElement).toBe(document.body)
    expect(dialog.closest('[data-job-id]')).toBeNull()
  })
})
