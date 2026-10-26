import { Button } from '@renderer/components/ui/Button'
import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import type { DownloadJob } from '@shared/types/download'
import { FolderOpen, Pause, Play, RotateCcw, X } from 'lucide-react'

import { DownloadOverflowMenu } from './DownloadOverflowMenu'

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
        <DownloadOverflowMenu id={job.id} onCopy={onCopy} onDelete={onDelete} onRemove={onRemove} />
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
