import { Card } from '@renderer/components/ui/Card'
import { Checkbox } from '@renderer/components/ui/Checkbox'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { Select, type SelectOption } from '@renderer/components/ui/Select'
import type { DownloaderOptions } from '@renderer/features/downloader/downloader-types'
import { COPY } from '@renderer/lib/copy'
import { formatBytes } from '@renderer/lib/format'
import type {
  AudioBitrate,
  AudioFormat,
  DownloadKind,
  QualityTier,
  VideoContainer,
} from '@shared/types/media'
import { FileAudio2, FileDown, Video } from 'lucide-react'

const QUALITY_LABELS: Readonly<Record<QualityTier, string>> = COPY.downloader.qualityLabels
const QUALITY_VALUES: readonly QualityTier[] = [2160, 1440, 1080, 720, 480]
const CONTAINERS: readonly SelectOption[] = [
  { label: COPY.downloader.formats.mp4, value: 'mp4' },
  { label: COPY.downloader.formats.mkv, value: 'mkv' },
]
const AUDIO_FORMATS: readonly SelectOption[] = [
  { label: COPY.downloader.formats.mp3, value: 'mp3' },
  { label: COPY.downloader.formats.m4a, value: 'm4a' },
  { label: COPY.downloader.formats.wav, value: 'wav' },
]

interface DownloadOptionsCardProps {
  availableQualities: readonly QualityTier[]
  estimatedBytes?: number | undefined
  estimateIsApproximate: boolean
  onChange: <Key extends keyof DownloaderOptions>(key: Key, value: DownloaderOptions[Key]) => void
  options: DownloaderOptions
}

export function DownloadOptionsCard({
  availableQualities,
  estimatedBytes,
  estimateIsApproximate,
  onChange,
  options,
}: DownloadOptionsCardProps): React.JSX.Element {
  const qualityOptions = QUALITY_VALUES.map((quality) => ({
    disabled: !availableQualities.includes(quality),
    label: availableQualities.includes(quality)
      ? QUALITY_LABELS[quality]
      : COPY.downloader.qualityUnavailable(QUALITY_LABELS[quality]),
    value: String(quality),
  }))
  const bitrateOptions: readonly SelectOption[] = [320, 256, 128].map((bitrate) => ({
    disabled: options.audioFormat === 'wav',
    label: COPY.downloader.bitrateValue(bitrate),
    value: String(bitrate),
  }))
  return (
    <Card
      className="flex min-h-[154px] flex-col p-3 @min-[1024px]:self-start"
      data-testid="download-options"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-fg-heading flex items-center gap-2 text-xs font-bold">
          {options.kind === 'video' ? (
            <Video className="text-accent size-4" />
          ) : (
            <FileAudio2 className="text-accent size-4" />
          )}
          {options.kind === 'video' ? COPY.downloader.videoSetup : COPY.downloader.audioSetup}
        </h2>
        <SegmentedControl<DownloadKind>
          label={COPY.downloader.mediaType}
          onChange={(value) => onChange('kind', value)}
          options={[
            { label: COPY.downloader.video, value: 'video' },
            { label: COPY.downloader.audio, value: 'audio' },
          ]}
          value={options.kind}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {options.kind === 'video' ? (
          <>
            <Select
              label={COPY.downloader.quality}
              onChange={(value) => onChange('quality', Number(value) as QualityTier)}
              options={qualityOptions}
              value={String(options.quality)}
            />
            <Select
              label={COPY.downloader.container}
              onChange={(value) => onChange('container', value as VideoContainer)}
              options={CONTAINERS}
              value={options.container}
            />
          </>
        ) : (
          <>
            <Select
              label={COPY.downloader.audioFormat}
              onChange={(value) => onChange('audioFormat', value as AudioFormat)}
              options={AUDIO_FORMATS}
              value={options.audioFormat}
            />
            <Select
              disabled={options.audioFormat === 'wav'}
              label={COPY.downloader.bitrate}
              onChange={(value) => onChange('bitrate', Number(value) as AudioBitrate)}
              options={bitrateOptions}
              value={String(options.bitrate)}
            />
          </>
        )}
      </div>
      <div className="border-line-subtle text-fg-muted mt-2 flex items-center justify-between border-t pt-2 text-[10px]">
        <span className="flex items-center gap-1.5">
          <FileDown aria-hidden="true" className="text-accent size-3" />
          {COPY.downloader.estimatedSize}: {estimateIsApproximate ? '~' : ''}
          {formatBytes(estimatedBytes)}
        </span>
        <Checkbox
          checked={options.embedMetadata}
          disabled={options.kind === 'video' && options.container === 'mkv'}
          label={COPY.downloader.embedMetadata}
          onChange={(checked) => onChange('embedMetadata', checked)}
        />
      </div>
    </Card>
  )
}
