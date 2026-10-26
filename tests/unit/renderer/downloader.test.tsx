import { DownloadOptionsCard } from '@renderer/features/downloader/components/DownloadOptionsCard'
import { UrlInputCard } from '@renderer/features/downloader/components/UrlInputCard'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const callbacks = {
  onClear: vi.fn(),
  onPaste: vi.fn(),
  onSubmit: vi.fn(),
  onUrlChange: vi.fn(),
}

describe('Downloader URL card', () => {
  it('renders idle, probing, ready, and error states without shifting the input', () => {
    const { rerender } = render(<UrlInputCard {...callbacks} phase="idle" url="" />)
    expect(screen.getByLabelText('Video or audio link')).toBeVisible()
    rerender(<UrlInputCard {...callbacks} phase="probing" url="https://example.test/video" />)
    expect(screen.getByText('Reading link…')).toBeVisible()
    rerender(
      <UrlInputCard
        {...callbacks}
        phase="ready"
        platform="Example"
        url="https://example.test/video"
      />,
    )
    expect(screen.getByText('Valid link detected: Example')).toBeVisible()
    rerender(
      <UrlInputCard
        {...callbacks}
        error="This media is unavailable."
        phase="error"
        url="https://example.test/video"
      />,
    )
    expect(screen.getByText('This media is unavailable.')).toBeVisible()
  })

  it('submits with preserve enabled for the modifier shortcut', async () => {
    const user = userEvent.setup()
    render(<UrlInputCard {...callbacks} phase="ready" url="https://example.test/video" />)
    const input = screen.getByLabelText('Video or audio link')
    input.focus()
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(callbacks.onSubmit).toHaveBeenCalledWith(true)
  })
})

describe('Downloader options card', () => {
  it('shows 8K when the probed media provides it', () => {
    render(
      <DownloadOptionsCard
        availableQualities={[4320]}
        estimateIsApproximate={false}
        onChange={vi.fn()}
        options={{
          kind: 'video',
          quality: 4320,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: true,
        }}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Quality' })).toHaveTextContent('8K (4320p)')
  })

  it('keeps 8K unavailable when the probe does not provide it', async () => {
    const user = userEvent.setup()
    render(
      <DownloadOptionsCard
        availableQualities={[1080, 720, 480]}
        estimateIsApproximate={false}
        onChange={vi.fn()}
        options={{
          kind: 'video',
          quality: 1080,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: true,
        }}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Quality' }))
    expect(screen.getByRole('option', { name: /8K \(4320p\)/u })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
