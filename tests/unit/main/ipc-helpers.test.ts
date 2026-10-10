import { safeSend } from '@main/ipc/helpers'
import type { BrowserWindow } from 'electron'
import { describe, expect, it, vi } from 'vitest'

function windowDouble(
  windowDestroyed: boolean,
  contentsDestroyed: boolean,
): {
  send: ReturnType<typeof vi.fn>
  window: BrowserWindow
} {
  const send = vi.fn()
  const window = {
    isDestroyed: () => windowDestroyed,
    webContents: { isDestroyed: () => contentsDestroyed, send },
  } as unknown as BrowserWindow
  return { send, window }
}

describe('safeSend', () => {
  it('never sends to a destroyed BrowserWindow or webContents', () => {
    const destroyedWindow = windowDouble(true, false)
    const destroyedContents = windowDouble(false, true)
    safeSend(destroyedWindow.window, 'event', {})
    safeSend(destroyedContents.window, 'event', {})
    expect(destroyedWindow.send).not.toHaveBeenCalled()
    expect(destroyedContents.send).not.toHaveBeenCalled()
  })

  it('sends only while both Electron objects are alive', () => {
    const active = windowDouble(false, false)
    safeSend(active.window, 'event', { ready: true })
    expect(active.send).toHaveBeenCalledWith('event', { ready: true })
  })
})
