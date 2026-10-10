import { afterEach, describe, expect, it, vi } from 'vitest'

import { fadeInWindow } from '../../../src/main/window/window-fade'

describe('window fade', () => {
  afterEach(() => vi.useRealTimers())

  it('stops safely when the window is destroyed during startup', () => {
    vi.useFakeTimers()
    let destroyed = false
    const setOpacity = vi.fn(() => {
      if (destroyed) throw new Error('Object has been destroyed')
    })
    const window = {
      isDestroyed: () => destroyed,
      once: vi.fn(),
      setOpacity,
    }

    fadeInWindow(window)
    destroyed = true

    expect(() => vi.advanceTimersByTime(48)).not.toThrow()
    expect(setOpacity).not.toHaveBeenCalled()
  })

  it('clears the animation timer when the window closes', () => {
    vi.useFakeTimers()
    let onClosed = (): void => undefined
    const setOpacity = vi.fn()
    const window = {
      isDestroyed: () => false,
      once: vi.fn((_event: 'closed', listener: () => void) => {
        onClosed = listener
      }),
      setOpacity,
    }

    fadeInWindow(window)
    vi.advanceTimersByTime(24)
    onClosed()
    vi.advanceTimersByTime(240)

    expect(setOpacity).toHaveBeenCalledTimes(1)
  })
})
