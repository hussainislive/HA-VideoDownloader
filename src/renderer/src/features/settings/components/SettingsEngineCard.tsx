import { Badge } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import type { EngineStatus } from '@shared/types/engine'
import { Film, RefreshCw, Terminal } from 'lucide-react'

interface SettingsEngineCardProps {
  feedback: string | undefined
  loading: boolean
  onUpdate: () => void
  status: EngineStatus | undefined
}

export function SettingsEngineCard({
  feedback,
  loading,
  onUpdate,
  status,
}: SettingsEngineCardProps): React.JSX.Element {
  return (
    <Card className="flex min-h-0 flex-col p-3.5" variant="solid">
      <div className="mb-2 flex items-center gap-2">
        <Terminal aria-hidden="true" className="text-accent size-4" />
        <h2 className="text-fg-heading text-sm font-bold">{COPY.settings.engine}</h2>
      </div>
      <div className="flex flex-col gap-1.5">
        <EngineRow
          detected={status?.ytdlp.found === true}
          icon={Terminal}
          label={COPY.settings.ytdlp}
          version={status?.ytdlp.version}
        />
        <EngineRow
          detected={status?.ffmpeg.found === true}
          icon={Film}
          label={COPY.settings.ffmpeg}
          version={status?.ffmpeg.version}
        />
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <Button loading={loading} onClick={onUpdate} size="sm" variant="primary">
          <RefreshCw aria-hidden="true" className="size-3.5" />
          {loading ? COPY.settings.checking : COPY.settings.checkUpdate}
        </Button>
        {feedback ? (
          <span className="text-fg-muted min-w-0 truncate text-[10px]" title={feedback}>
            {feedback}
          </span>
        ) : null}
      </div>
    </Card>
  )
}

function EngineRow({
  detected,
  icon: Icon,
  label,
  version,
}: {
  detected: boolean
  icon: typeof Terminal
  label: string
  version: string | undefined
}): React.JSX.Element {
  return (
    <div className="bg-surface-elevated flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-1.5">
      <Icon aria-hidden="true" className="text-accent size-3.5" />
      <span className="text-fg-heading text-[11px] font-semibold">{label}</span>
      <span className="telemetry text-fg-body min-w-0 flex-1 truncate text-[9px]" title={version}>
        {version ?? COPY.settings.unavailable}
      </span>
      <Badge tone={detected ? 'accent' : 'danger'}>
        {detected
          ? label === COPY.settings.ffmpeg
            ? COPY.settings.bundled
            : COPY.settings.detected
          : COPY.settings.unavailable}
      </Badge>
    </div>
  )
}
