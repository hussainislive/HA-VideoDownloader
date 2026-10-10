import { COPY } from '@renderer/lib/copy'
import { Download } from 'lucide-react'

import { EngineStatusPill } from './EngineStatusPill'
import { WindowControls } from './WindowControls'

export function TitleBar(): React.JSX.Element {
  return (
    <header
      className="app-drag border-line-subtle bg-canvas-from/70 flex h-11 shrink-0 items-center justify-between border-b pr-4 pl-[var(--titlebar-inset-left)]"
      onDoubleClick={() => void window.api.window.toggleMaximize()}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="border-line-strong bg-accent-soft text-accent shadow-glow-sm flex size-6 shrink-0 items-center justify-center rounded-lg border">
          <Download aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
        </span>
        <span className="text-fg-heading truncate text-[13px] font-semibold tracking-tight">
          {COPY.appName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <EngineStatusPill />
        <WindowControls />
      </div>
    </header>
  )
}
