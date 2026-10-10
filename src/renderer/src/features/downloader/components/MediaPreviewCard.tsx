import { Badge } from '@renderer/components/ui/Badge'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import { formatCount, formatDate, formatDuration } from '@renderer/lib/format'
import type { MediaInfo } from '@shared/types/media'
import { CalendarDays, Eye, ImageOff, ListVideo, UserRound } from 'lucide-react'
import { useState } from 'react'

function Thumbnail({ media }: { media: MediaInfo }): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <div className="bg-surface-elevated relative aspect-video h-full max-h-24 min-h-20 shrink-0 overflow-hidden rounded-xl">
      {media.thumbnailUrl && !imageFailed ? (
        <img
          alt=""
          className="size-full object-cover"
          decoding="async"
          height="108"
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={media.thumbnailUrl}
          width="192"
        />
      ) : (
        <span className="text-fg-body flex size-full flex-col items-center justify-center gap-1 text-[9px]">
          <ImageOff aria-hidden="true" className="size-5" />
          {COPY.downloader.previewFallback}
        </span>
      )}
      {media.durationSec !== undefined ? (
        <span className="bg-canvas-from/85 text-fg-heading telemetry absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-[9px]">
          {formatDuration(media.durationSec)}
        </span>
      ) : null}
    </div>
  )
}

export function MediaPreviewCard({ media }: { media: MediaInfo }): React.JSX.Element {
  const uploaded = formatDate(media.uploadDate)
  return (
    <Card className="flex min-h-[102px] gap-3 overflow-hidden p-2.5" data-testid="media-preview">
      <Thumbnail key={media.thumbnailUrl ?? media.id} media={media} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Badge tone="danger">{media.extractor}</Badge>
          {media.isPlaylistEntry ? (
            <Badge tone="info">
              <ListVideo aria-hidden="true" className="mr-1 size-3" />
              {COPY.downloader.playlistItem}
            </Badge>
          ) : null}
        </div>
        <h2
          className="text-fg-heading line-clamp-2 text-[13px] leading-5 font-bold"
          title={media.title}
        >
          {media.title}
        </h2>
        <div className="text-fg-muted mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
          {media.uploader ? (
            <span className="flex min-w-0 items-center gap-1">
              <UserRound aria-hidden="true" className="size-3" />
              <span className="max-w-48 truncate" title={media.uploader}>
                {media.uploader}
              </span>
            </span>
          ) : null}
          {media.viewCount !== undefined ? (
            <span className="flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3" />
              {COPY.downloader.viewCount(formatCount(media.viewCount))}
            </span>
          ) : null}
          {uploaded ? (
            <span className="flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="size-3" /> {uploaded}
            </span>
          ) : null}
        </div>
        {media.isPlaylistEntry ? (
          <p className="text-info mt-1 text-[9px]">{COPY.downloader.playlist}</p>
        ) : null}
      </div>
    </Card>
  )
}
