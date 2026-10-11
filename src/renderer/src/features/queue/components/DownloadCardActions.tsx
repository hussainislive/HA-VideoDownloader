import { Button } from '@renderer/components/ui/Button'
import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import type { DownloadJob } from '@shared/types/download'
import { Copy, Ellipsis, FolderOpen, Pause, Play, RotateCcw, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface DownloadCardActionsProps {
  job: DownloadJob
  onCancel: () => void
  onCopy: () => void
  onDelete: () => void
  onRemove: () => void
  onRun: (action: () => Promise<unknown>) => void
}

function suggestsEngineUpdate(job: DownloadJob): boolean {
  return (
    job.error?.code === 'HTTP_403_OR_BLOCKED' ||
    job.error?.code === 'UNKNOWN' ||
    job.error?.hint?.toLocaleLowerCase().includes('update') === true
  )
}

export function DownloadCardActions({
  job,
  onCancel,
  onCopy,
  onDelete,
  onRemove,
  onRun,
}: DownloadCardActionsProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent | KeyboardEvent): void => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof MouseEvent && menuRef.current?.contains(event.target as Node)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  if (job.state === 'completed') {
    const filePath = job.filePath
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          disabled={!filePath}
          onClick={() => filePath && onRun(() => window.api.shell.showInFolder(filePath))}
          size="sm"
          variant="ghost"
        >
          <FolderOpen aria-hidden="true" className="size-3.5" /> {COPY.queue.openFolder}
        </Button>
        <Button
          disabled={!filePath}
          onClick={() => filePath && onRun(() => window.api.shell.openFile(filePath))}
          size="sm"
          variant="secondary"
        >
          <Play aria-hidden="true" className="size-3.5" /> {COPY.queue.quickPlay}
        </Button>
        <div className="relative" ref={menuRef}>
          <IconButton label={COPY.queue.more} onClick={() => setMenuOpen((open) => !open)}>
            <Ellipsis aria-hidden="true" className="size-4" />
          </IconButton>
          {menuOpen ? (
            <div className="border-line-strong bg-surface-solid shadow-card absolute right-0 z-30 mt-1 w-36 rounded-xl border p-1 text-[10px]">
              <button
                className="hover:bg-surface-elevated flex w-full items-center gap-2 rounded-lg px-2.5 py-2"
                onClick={onCopy}
                type="button"
              >
                <Copy aria-hidden="true" className="size-3" />
                {COPY.queue.copyLink}
              </button>
              <button
                className="hover:bg-surface-elevated flex w-full items-center gap-2 rounded-lg px-2.5 py-2"
                onClick={onRemove}
                type="button"
              >
                <X aria-hidden="true" className="size-3" />
                {COPY.queue.remove}
              </button>
              <button
                className="text-danger hover:bg-danger-soft flex w-full items-center gap-2 rounded-lg px-2.5 py-2"
                onClick={onDelete}
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-3" />
                {COPY.queue.deleteFile}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
  if (job.state === 'failed' || job.state === 'canceled') {
    return (
      <div className="flex shrink-0 gap-1.5">
        <Button
          onClick={() => onRun(() => window.api.downloads.retry(job.id))}
          size="sm"
          variant="secondary"
        >
          <RotateCcw aria-hidden="true" className="size-3" />
          {COPY.actions.retry}
        </Button>
        {job.state === 'failed' && suggestsEngineUpdate(job) ? (
          <Button
            onClick={() => onRun(() => window.api.engine.checkUpdate())}
            size="sm"
            variant="ghost"
          >
            {COPY.queue.updateEngine}
          </Button>
        ) : null}
        <Button onClick={onRemove} size="sm" variant="ghost">
          {COPY.queue.remove}
        </Button>
      </div>
    )
  }
  return (
    <div className="flex shrink-0 gap-1.5">
      {job.state === 'paused' ? (
        <Button
          onClick={() => onRun(() => window.api.downloads.resume(job.id))}
          size="sm"
          variant="secondary"
        >
          <Play aria-hidden="true" className="size-3" />
          {COPY.queue.resume}
        </Button>
      ) : job.state !== 'queued' ? (
        <Button
          onClick={() => onRun(() => window.api.downloads.pause(job.id))}
          size="sm"
          variant="secondary"
        >
          <Pause aria-hidden="true" className="size-3" />
          {COPY.queue.pause}
        </Button>
      ) : null}
      <IconButton label={COPY.actions.cancel} onClick={onCancel}>
        <X aria-hidden="true" className="size-4" />
      </IconButton>
    </div>
  )
}
