import { COPY } from '@renderer/lib/copy'
import { CircleAlert } from 'lucide-react'

export function EngineStatusPill(): React.JSX.Element {
  return (
    <div className="app-no-drag border-warning/30 bg-warning-soft text-warning flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
      <CircleAlert aria-hidden="true" className="size-3" />
      <span>{COPY.enginePending}</span>
    </div>
  )
}
