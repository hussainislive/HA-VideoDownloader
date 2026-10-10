import { COPY } from '@renderer/lib/copy'
import { useEngineStore } from '@renderer/store/engine-store'
import { navigateToTab } from '@renderer/store/ui-store'
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react'

export function EngineStatusPill(): React.JSX.Element {
  const loading = useEngineStore((state) => state.loading)
  const status = useEngineStore((state) => state.status)
  const ready = status?.ok === true
  const label = loading ? COPY.engine.checking : ready ? COPY.engine.ready : COPY.engine.problem
  const Icon = loading ? LoaderCircle : ready ? CheckCircle2 : CircleAlert
  return (
    <button
      className={`app-no-drag flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${ready ? 'border-line-strong bg-accent-soft text-accent' : 'border-warning/30 bg-warning-soft text-warning'}`}
      disabled={loading || ready}
      onClick={() => navigateToTab('settings')}
      type="button"
    >
      <Icon aria-hidden="true" className={`size-3 ${loading ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </button>
  )
}
