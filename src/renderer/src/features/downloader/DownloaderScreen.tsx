import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { COPY } from '@renderer/lib/copy'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useUiStore } from '@renderer/store/ui-store'
import { Download, Link2, LoaderCircle, RefreshCw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

import { DownloadOptionsCard } from './components/DownloadOptionsCard'
import { MediaPreviewCard } from './components/MediaPreviewCard'
import { SaveLocationRow } from './components/SaveLocationRow'
import { UrlInputCard } from './components/UrlInputCard'
import type { DownloaderController } from './downloader-types'
import { useDownloader } from './hooks/use-downloader'

function extractDroppedUrl(value: string): string {
  return (
    value
      .split(/\s+/)
      .find((token) => token.startsWith('https://') || token.startsWith('http://')) ?? value.trim()
  )
}

function PreviewPane({ controller }: { controller: DownloaderController }): React.JSX.Element {
  const busy = controller.phase === 'probing' || controller.phase === 'validating'
  if (controller.media) return <MediaPreviewCard media={controller.media} />
  if (busy) {
    return (
      <Card
        className="flex min-h-[102px] items-center justify-center gap-2"
        data-testid="preview-skeleton"
      >
        <LoaderCircle aria-hidden="true" className="text-accent size-5 animate-spin" />
        <span className="text-fg-muted text-xs">{COPY.downloader.reading}</span>
      </Card>
    )
  }
  return (
    <Card
      className="text-fg-muted flex min-h-[102px] items-center justify-center gap-2 text-xs"
      variant="solid"
    >
      <Link2 aria-hidden="true" className="text-accent size-5" />
      {controller.userMessage ?? COPY.downloader.urlPlaceholder}
      {controller.phase === 'error' && controller.url ? (
        <Button onClick={controller.probeNow} size="sm" variant="ghost">
          <RefreshCw aria-hidden="true" className="size-3" /> {COPY.actions.retry}
        </Button>
      ) : null}
    </Card>
  )
}

function downloadVariant(controller: DownloaderController): string {
  return controller.options.kind === 'video'
    ? `${controller.options.quality}p`
    : controller.options.audioFormat.toUpperCase()
}

export default function DownloaderScreen(): React.JSX.Element {
  const controller = useDownloader()
  const settings = useSettingsStore((state) => state.settings)
  const activeTab = useUiStore((state) => state.activeTab)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()
  const { clear, lowDiskWarning, paste } = controller

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (activeTab !== 'downloader') return
      const modifier = event.metaKey || event.ctrlKey
      if (modifier && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      } else if (modifier && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        inputRef.current?.focus()
        void paste()
      } else if (event.key === 'Escape' && !lowDiskWarning) clear()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, clear, lowDiskWarning, paste])

  return (
    <div
      className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-3"
      data-testid="downloader-screen"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const value =
          event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain')
        if (value) controller.setUrl(extractDroppedUrl(value), false)
      }}
    >
      <UrlInputCard
        ref={inputRef}
        error={controller.userMessage}
        onClear={controller.clear}
        onPaste={() => void controller.paste()}
        onSubmit={(preserve) => void controller.submit(false, preserve)}
        onUrlChange={controller.setUrl}
        phase={controller.phase}
        platform={controller.media?.extractor}
        url={controller.url}
      />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid min-h-0 flex-1 grid-rows-[minmax(102px,1fr)_154px] gap-3 @min-[1024px]:grid-cols-2 @min-[1024px]:grid-rows-1"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 7 }}
        transition={{ duration: reduceMotion ? 0.08 : 0.2 }}
      >
        <PreviewPane controller={controller} />
        <DownloadOptionsCard
          availableQualities={controller.availableQualities}
          estimatedBytes={controller.sizeEstimate?.bytes}
          estimateIsApproximate={controller.sizeEstimate?.approximate === true}
          onChange={controller.setOption}
          options={controller.options}
        />
      </motion.div>

      <SaveLocationRow
        freeBytes={controller.freeBytes}
        onChange={() => void controller.selectFolder()}
        path={settings?.downloadDir}
      />
      <Button
        className="h-12 w-full text-sm"
        disabled={controller.phase !== 'ready' || !settings}
        loading={controller.isEnqueuing}
        onClick={() => void controller.submit()}
        size="lg"
        variant="primary"
      >
        <Download aria-hidden="true" className="size-4" />
        {COPY.downloader.download}
        {` · ${downloadVariant(controller)}`}
      </Button>
      <ConfirmDialog
        confirmLabel={COPY.downloader.downloadAnyway}
        description={COPY.downloader.lowDiskDescription}
        onCancel={() => controller.setLowDiskWarning(false)}
        onConfirm={() => void controller.submit(true)}
        open={controller.lowDiskWarning}
        title={COPY.downloader.lowDiskTitle}
      />
    </div>
  )
}
