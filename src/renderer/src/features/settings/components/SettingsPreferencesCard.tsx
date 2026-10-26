import { Card } from '@renderer/components/ui/Card'
import { Select } from '@renderer/components/ui/Select'
import { Switch } from '@renderer/components/ui/Switch'
import { COPY } from '@renderer/lib/copy'
import type { QualityTier, VideoContainer } from '@shared/types/media'
import type { Settings, SettingsUpdate } from '@shared/types/settings'
import { SlidersHorizontal } from 'lucide-react'

const QUALITY_OPTIONS = [
  { value: '4320', label: COPY.downloader.qualityLabels[4320] },
  { value: '2160', label: COPY.downloader.qualityLabels[2160] },
  { value: '1440', label: COPY.downloader.qualityLabels[1440] },
  { value: '1080', label: COPY.downloader.qualityLabels[1080] },
  { value: '720', label: COPY.downloader.qualityLabels[720] },
  { value: '480', label: COPY.downloader.qualityLabels[480] },
] as const
const CONTAINER_OPTIONS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
] as const
const CONCURRENCY_OPTIONS = [1, 2, 3, 4].map((value) => ({
  value: String(value),
  label: String(value),
}))
const QUALITY_VALUES: Readonly<Record<string, QualityTier>> = {
  '4320': 4320,
  '2160': 2160,
  '1440': 1440,
  '1080': 1080,
  '720': 720,
  '480': 480,
}

function videoContainer(value: string): VideoContainer | undefined {
  return value === 'mp4' || value === 'mkv' ? value : undefined
}

interface SettingsPreferencesCardProps {
  onUpdate: (update: SettingsUpdate) => void
  settings: Settings
}

export function SettingsPreferencesCard({
  onUpdate,
  settings,
}: SettingsPreferencesCardProps): React.JSX.Element {
  return (
    <Card className="flex min-h-0 flex-col p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <SlidersHorizontal aria-hidden="true" className="text-accent size-4" />
        <h2 className="text-fg-heading text-sm font-bold">{COPY.settings.preferences}</h2>
      </div>
      <div className="flex flex-col gap-2">
        <Switch
          checked={settings.autoPasteClipboard}
          description={COPY.settings.autoPasteDescription}
          label={COPY.settings.autoPaste}
          onChange={(autoPasteClipboard) => onUpdate({ autoPasteClipboard })}
        />
        <Switch
          checked={settings.notifyOnComplete}
          description={COPY.settings.notificationsDescription}
          label={COPY.settings.notifications}
          onChange={(notifyOnComplete) => onUpdate({ notifyOnComplete })}
        />
        <Switch
          checked={settings.keepWindowOnTop}
          description={COPY.settings.alwaysOnTopDescription}
          label={COPY.settings.alwaysOnTop}
          onChange={(keepWindowOnTop) => onUpdate({ keepWindowOnTop })}
        />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <Select
          label={COPY.settings.defaultQuality}
          onChange={(value) => {
            const defaultQuality = QUALITY_VALUES[value]
            if (defaultQuality) onUpdate({ defaultQuality })
          }}
          options={QUALITY_OPTIONS}
          value={String(settings.defaultQuality)}
        />
        <Select
          label={COPY.settings.defaultContainer}
          onChange={(value) => {
            const defaultContainer = videoContainer(value)
            if (defaultContainer) onUpdate({ defaultContainer })
          }}
          options={CONTAINER_OPTIONS}
          value={settings.defaultContainer}
        />
        <Select
          label={COPY.settings.concurrency}
          onChange={(value) => onUpdate({ maxConcurrent: Number(value) })}
          options={CONCURRENCY_OPTIONS}
          value={String(settings.maxConcurrent)}
        />
      </div>
    </Card>
  )
}
