import { Badge } from '@renderer/components/ui/Badge'
import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import { formatBytes, formatDate, formatDuration } from '@renderer/lib/format'
import type { LibraryItem } from '@shared/types/history'
import { FileQuestion, FolderOpen, Music2, Play, Trash2 } from 'lucide-react'
import { memo, useState } from 'react'

interface HistoryRowProps {
  item: LibraryItem
  onDelete: (item: LibraryItem) => void
  onOpen: (item: LibraryItem) => void
  onPlay: (item: LibraryItem) => void
}

function mediaLabel(item: LibraryItem): string {
  if (item.options.kind === 'audio') {
    const bitrate = item.options.audioFormat === 'wav' ? '' : ` ${item.options.bitrate}kbps`
    return `${item.options.audioFormat.toUpperCase()}${bitrate}`
  }
  return `${item.options.quality}p ${item.options.container.toUpperCase()}`
}

function HistoryRowComponent({
  item,
  onDelete,
  onOpen,
  onPlay,
}: HistoryRowProps): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(item.thumbnailUrl) && !imageFailed

  return (
    <article
      className="library-row border-line bg-surface-solid hover:border-line-strong flex h-[76px] items-center gap-3 rounded-xl border p-2.5 transition-[border-color,opacity]"
      data-library-id={item.id}
      data-missing={!item.fileExists}
    >
      <div className="bg-surface-elevated relative h-14 w-24 shrink-0 overflow-hidden rounded-lg">
        {showImage ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            decoding="async"
            height={56}
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={item.thumbnailUrl}
            width={96}
          />
        ) : (
          <span className="text-accent flex h-full items-center justify-center">
            {item.options.kind === 'audio' ? (
              <Music2 aria-hidden="true" className="size-5" />
            ) : (
              <FileQuestion aria-hidden="true" className="size-5" />
            )}
          </span>
        )}
        <span className="telemetry bg-canvas-from/80 text-fg-heading absolute right-1 bottom-1 rounded px-1 text-[9px]">
          {formatDuration(item.durationSec)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-fg-heading truncate text-xs font-semibold" title={item.title}>
            {item.title}
          </h2>
          {!item.fileExists ? <Badge tone="warning">{COPY.library.fileMissing}</Badge> : null}
        </div>
        <div className="text-fg-muted mt-1 flex min-w-0 items-center gap-1.5 text-[10px]">
          <span className="text-fg-body max-w-32 truncate" title={item.uploader}>
            {item.uploader ?? item.platform}
          </span>
          <span aria-hidden="true">•</span>
          <Badge tone="neutral">{mediaLabel(item)}</Badge>
          <span aria-hidden="true">•</span>
          <span className="telemetry whitespace-nowrap">{formatBytes(item.fileSize)}</span>
          <span aria-hidden="true" className="hidden @min-[960px]:inline">
            •
          </span>
          <span className="hidden whitespace-nowrap @min-[960px]:inline">
            {formatDate(item.completedAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <IconButton
          className="disabled:opacity-30"
          disabled={!item.fileExists}
          label={COPY.library.play}
          onClick={() => onPlay(item)}
          size="compact"
        >
          <Play aria-hidden="true" className="size-3.5" />
        </IconButton>
        <IconButton
          className="disabled:opacity-30"
          disabled={!item.fileExists}
          label={COPY.library.openLocation}
          onClick={() => onOpen(item)}
          size="compact"
        >
          <FolderOpen aria-hidden="true" className="size-3.5" />
        </IconButton>
        <IconButton
          className="hover:border-danger/60 hover:text-danger"
          label={COPY.library.delete}
          onClick={() => onDelete(item)}
          size="compact"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </IconButton>
      </div>
    </article>
  )
}

export const HistoryRow = memo(HistoryRowComponent)
