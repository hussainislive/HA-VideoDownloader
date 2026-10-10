interface FadeWindow {
  isDestroyed: () => boolean
  once: (event: 'closed', listener: () => void) => unknown
  setOpacity: (opacity: number) => void
}

export function fadeInWindow(window: FadeWindow): void {
  let opacity = 0
  const timer = setInterval(() => {
    if (window.isDestroyed()) {
      clearInterval(timer)
      return
    }
    opacity = Math.min(opacity + 0.2, 1)
    window.setOpacity(opacity)
    if (opacity === 1) clearInterval(timer)
  }, 24)

  window.once('closed', () => clearInterval(timer))
}
