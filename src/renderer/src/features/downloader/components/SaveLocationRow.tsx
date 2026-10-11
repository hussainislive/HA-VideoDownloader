import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import { formatBytes } from '@renderer/lib/format'
import { Folder, HardDrive } from 'lucide-react'

interface SaveLocationRowProps {
  freeBytes?: number | undefined
  onChange: () => void
  path?: string | undefined
}

export function SaveLocationRow({
  freeBytes,
  onChange,
  path,
}: SaveLocationRowProps): React.JSX.Element {
  return (
    <Card className="flex h-9 items-center gap-2 px-3" variant="solid">
      <Folder aria-hidden="true" className="text-accent size-4 shrink-0" />
      <span className="text-fg-muted shrink-0 text-[10px]">{COPY.downloader.savingTo}:</span>
      <span className="text-fg-body min-w-0 flex-1 truncate text-[10px]" title={path}>
        {path ?? '—'}
      </span>
      <Button className="h-6 px-2" disabled={!path} onClick={onChange} size="sm" variant="ghost">
        {COPY.downloader.change}
      </Button>
      {freeBytes !== undefined ? (
        <span className="text-fg-muted telemetry flex shrink-0 items-center gap-1 text-[9px]">
          <HardDrive aria-hidden="true" className="text-accent size-3" /> {COPY.downloader.free}:{' '}
          {formatBytes(freeBytes)}
        </span>
      ) : null}
    </Card>
  )
}
