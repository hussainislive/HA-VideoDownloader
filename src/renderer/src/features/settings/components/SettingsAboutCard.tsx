import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import { Info } from 'lucide-react'

interface SettingsAboutCardProps {
  onOpenAbout: () => void
  version: string | undefined
}

export function SettingsAboutCard({
  onOpenAbout,
  version,
}: SettingsAboutCardProps): React.JSX.Element {
  return (
    <Card className="flex min-h-0 items-center gap-3 p-3.5" variant="solid">
      <span className="border-line bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border">
        <Info aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg-heading text-sm font-bold">{COPY.settings.aboutApp}</h2>
          {version ? <span className="telemetry text-accent text-[10px]">v{version}</span> : null}
        </div>
        <p className="text-fg-muted mt-0.5 text-[10px]">{COPY.settings.aboutDescription}</p>
      </div>
      <Button onClick={onOpenAbout} size="sm" variant="ghost">
        {COPY.settings.viewAbout}
      </Button>
    </Card>
  )
}
