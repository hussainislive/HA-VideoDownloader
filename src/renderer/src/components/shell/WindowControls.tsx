import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import { Minus, Square, SquaresUnite, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function WindowControls(): React.JSX.Element | null {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void window.api.window.isMaximized().then((result) => {
      if (result.ok) setMaximized(result.value)
    })
    return window.api.window.onMaximizedChange(setMaximized)
  }, [])

  if (window.api.system.getPlatform() === 'darwin') return null
  return (
    <div className="app-no-drag flex items-center gap-1" data-testid="window-controls">
      <IconButton
        label={COPY.accessibility.minimizeWindow}
        onClick={() => void window.api.window.minimize()}
        size="compact"
      >
        <Minus aria-hidden="true" className="size-3.5" />
      </IconButton>
      <IconButton
        label={maximized ? COPY.accessibility.restoreWindow : COPY.accessibility.maximizeWindow}
        onClick={() => void window.api.window.toggleMaximize()}
        size="compact"
      >
        {maximized ? (
          <SquaresUnite aria-hidden="true" className="size-3" />
        ) : (
          <Square aria-hidden="true" className="size-3" />
        )}
      </IconButton>
      <IconButton
        className="hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
        label={COPY.accessibility.closeWindow}
        onClick={() => void window.api.window.close()}
        size="compact"
      >
        <X aria-hidden="true" className="size-3.5" />
      </IconButton>
    </div>
  )
}
