import { Card } from '@renderer/components/ui/Card'
import { IconButton } from '@renderer/components/ui/IconButton'
import type { LinkPhase } from '@renderer/features/downloader/downloader-types'
import { COPY } from '@renderer/lib/copy'
import { CheckCircle2, ClipboardPaste, Link2, LoaderCircle, X } from 'lucide-react'
import { forwardRef } from 'react'

interface UrlInputCardProps {
  error?: string | undefined
  onClear: () => void
  onPaste: () => void
  onSubmit: (preserveUrl: boolean) => void
  onUrlChange: (url: string) => void
  phase: LinkPhase
  platform?: string | undefined
  url: string
}

export const UrlInputCard = forwardRef<HTMLInputElement, UrlInputCardProps>(function UrlInputCard(
  { error, onClear, onPaste, onSubmit, onUrlChange, phase, platform, url },
  ref,
) {
  const busy = phase === 'validating' || phase === 'probing'
  return (
    <Card
      className="flex min-h-[66px] flex-col justify-center gap-1.5 p-2.5"
      data-testid="url-card"
    >
      <div className="border-line bg-canvas-from/70 focus-within:border-accent flex h-9 items-center rounded-xl border px-2.5 transition-colors">
        <Link2 aria-hidden="true" className="text-accent mr-2 size-4 shrink-0" />
        <label className="sr-only" htmlFor="media-url">
          {COPY.downloader.urlLabel}
        </label>
        <input
          ref={ref}
          autoComplete="off"
          className="text-fg-heading placeholder:text-fg-muted min-w-0 flex-1 bg-transparent text-xs outline-none"
          id="media-url"
          onChange={(event) => onUrlChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSubmit(event.metaKey || event.ctrlKey)
            } else if (event.key === 'Escape') onClear()
          }}
          placeholder={COPY.downloader.urlPlaceholder}
          spellCheck={false}
          type="url"
          value={url}
        />
        {url ? (
          <IconButton label={COPY.actions.clear} onClick={onClear} size="compact">
            <X aria-hidden="true" className="size-3.5" />
          </IconButton>
        ) : null}
        <button
          className="border-line bg-accent-soft text-accent hover:border-line-strong ml-1 flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-colors"
          onClick={onPaste}
          type="button"
        >
          <ClipboardPaste aria-hidden="true" className="size-3" />
          {COPY.downloader.paste}
        </button>
      </div>
      <div className="flex min-h-4 items-center gap-1.5 px-1 text-[10px]" role="status">
        {busy ? (
          <>
            <LoaderCircle aria-hidden="true" className="text-accent size-3 animate-spin" />
            <span className="text-fg-muted">
              {phase === 'validating' ? COPY.downloader.checking : COPY.downloader.reading}
            </span>
          </>
        ) : phase === 'ready' ? (
          <>
            <CheckCircle2 aria-hidden="true" className="text-accent size-3" />
            <span className="text-accent">{COPY.downloader.validPlatform(platform ?? '')}</span>
          </>
        ) : error ? (
          <span className="text-danger">{error}</span>
        ) : (
          <span className="text-fg-muted">{COPY.downloader.urlPlaceholder}</span>
        )}
      </div>
    </Card>
  )
})
