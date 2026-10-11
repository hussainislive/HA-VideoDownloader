import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import { formatBytes } from '@renderer/lib/format'
import { Clipboard, Folder, FolderOpen, RotateCcw } from 'lucide-react'

interface SettingsLocationCardProps {
  freeBytes: number | undefined
  onChange: () => void
  onCopy: () => void
  onOpen: () => void
  onReset: () => void
  path: string
}

export function SettingsLocationCard({
  freeBytes,
  onChange,
  onCopy,
  onOpen,
  onReset,
  path,
}: SettingsLocationCardProps): React.JSX.Element {
  return (
    <Card className="flex min-h-0 flex-col p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <FolderOpen aria-hidden="true" className="text-accent size-4" />
        <h2 className="text-fg-heading text-sm font-bold">{COPY.settings.downloadLocation}</h2>
      </div>
      <div className="border-line bg-canvas-from/60 flex h-9 items-center gap-2 rounded-lg border px-2.5">
        <Folder aria-hidden="true" className="text-accent size-3.5 shrink-0" />
        <span className="telemetry text-fg-body min-w-0 flex-1 truncate text-[10px]" title={path}>
          {path}
        </span>
        <IconButton
          className="border-0 bg-transparent"
          label={COPY.settings.copyPath}
          onClick={onCopy}
          size="compact"
        >
          <Clipboard aria-hidden="true" className="size-3.5" />
        </IconButton>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button onClick={onChange} size="sm">
          {COPY.settings.changePath}
        </Button>
        <Button onClick={onOpen} size="sm" variant="ghost">
          {COPY.settings.openFolder}
        </Button>
        <Button onClick={onReset} size="sm" variant="ghost">
          <RotateCcw aria-hidden="true" className="size-3" /> {COPY.settings.resetDefault}
        </Button>
        {freeBytes !== undefined ? (
          <span className="telemetry text-fg-muted ml-auto text-[10px]">
            {formatBytes(freeBytes)} {COPY.settings.free}
          </span>
        ) : null}
      </div>
    </Card>
  )
}
