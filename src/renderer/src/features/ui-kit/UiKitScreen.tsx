import { Badge } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { Checkbox } from '@renderer/components/ui/Checkbox'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { IconButton } from '@renderer/components/ui/IconButton'
import { Input } from '@renderer/components/ui/Input'
import { Kbd } from '@renderer/components/ui/Kbd'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { Select, type SelectOption } from '@renderer/components/ui/Select'
import { Spinner } from '@renderer/components/ui/Spinner'
import { Switch } from '@renderer/components/ui/Switch'
import { useToast } from '@renderer/components/ui/Toast'
import { Tooltip } from '@renderer/components/ui/Tooltip'
import { DEVELOPMENT_COPY } from '@renderer/lib/copy-development'
import { Bell, PackageOpen } from 'lucide-react'
import { useState } from 'react'

const SELECT_OPTIONS: readonly SelectOption[] = [
  { label: DEVELOPMENT_COPY.selection.fullHd, value: '1080' },
  { label: DEVELOPMENT_COPY.selection.hd, value: '720' },
  { disabled: true, label: DEVELOPMENT_COPY.selection.unavailable4k, value: '2160' },
]

const SEGMENTS = [
  { label: DEVELOPMENT_COPY.selection.video, value: 'video' },
  { label: DEVELOPMENT_COPY.selection.audio, value: 'audio' },
] as const

const UI_KIT = DEVELOPMENT_COPY

export default function UiKitScreen(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checked, setChecked] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [segment, setSegment] = useState<'video' | 'audio'>('video')
  const [quality, setQuality] = useState('1080')
  const { showToast } = useToast()

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <Badge tone="accent">{UI_KIT.badge}</Badge>
          <h1 className="text-fg-heading mt-2 text-xl font-bold">{UI_KIT.title}</h1>
          <p className="text-fg-muted text-xs">{UI_KIT.description}</p>
        </div>
        <Kbd>{UI_KIT.escapeKey}</Kbd>
      </div>

      <Card className="grid grid-cols-2 gap-5 p-4" variant="solid">
        <section className="space-y-3">
          <h2 className="text-fg-heading text-xs font-bold tracking-wider uppercase">
            {UI_KIT.sections.buttons}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">{UI_KIT.buttons.primary}</Button>
            <Button>{UI_KIT.buttons.secondary}</Button>
            <Button variant="ghost">{UI_KIT.buttons.ghost}</Button>
            <Button variant="danger">{UI_KIT.buttons.danger}</Button>
            <Button loading>{UI_KIT.buttons.working}</Button>
            <Button disabled>{UI_KIT.buttons.disabled}</Button>
            <Tooltip content={UI_KIT.buttons.notificationSettings}>
              <IconButton label={UI_KIT.buttons.notificationSettings}>
                <Bell aria-hidden="true" className="size-4" />
              </IconButton>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{UI_KIT.badges.accent}</Badge>
            <Badge>{UI_KIT.badges.neutral}</Badge>
            <Badge tone="info">{UI_KIT.badges.info}</Badge>
            <Badge tone="warning">{UI_KIT.badges.warning}</Badge>
            <Badge tone="danger">{UI_KIT.badges.danger}</Badge>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-fg-heading text-xs font-bold tracking-wider uppercase">
            {UI_KIT.sections.inputs}
          </h2>
          <Input label={UI_KIT.inputs.label} placeholder={UI_KIT.inputs.placeholder} />
          <Input
            compact
            error={UI_KIT.inputs.error}
            label={UI_KIT.inputs.errorLabel}
            value={UI_KIT.inputs.errorValue}
            readOnly
          />
          <Input
            disabled
            label={UI_KIT.inputs.disabledLabel}
            value={UI_KIT.inputs.disabledValue}
            readOnly
          />
        </section>
      </Card>

      <Card className="grid grid-cols-3 gap-5 p-4" variant="solid">
        <section className="space-y-3">
          <h2 className="text-fg-heading text-xs font-bold tracking-wider uppercase">
            {UI_KIT.sections.selection}
          </h2>
          <Select
            label={UI_KIT.selection.quality}
            onChange={setQuality}
            options={SELECT_OPTIONS}
            value={quality}
          />
          <SegmentedControl
            label={UI_KIT.selection.mediaType}
            onChange={setSegment}
            options={SEGMENTS}
            value={segment}
          />
        </section>
        <section className="space-y-4">
          <h2 className="text-fg-heading text-xs font-bold tracking-wider uppercase">
            {UI_KIT.sections.toggles}
          </h2>
          <Switch
            checked={enabled}
            description={UI_KIT.toggles.description}
            label={UI_KIT.toggles.autoPaste}
            onChange={setEnabled}
          />
          <Switch
            checked={false}
            disabled
            label={UI_KIT.toggles.disabledSwitch}
            onChange={() => undefined}
          />
          <Checkbox checked={checked} label={UI_KIT.toggles.embedMetadata} onChange={setChecked} />
          <Checkbox
            checked={false}
            disabled
            label={UI_KIT.toggles.disabledCheckbox}
            onChange={() => undefined}
          />
        </section>
        <section className="space-y-4">
          <h2 className="text-fg-heading text-xs font-bold tracking-wider uppercase">
            {UI_KIT.sections.feedback}
          </h2>
          <ProgressBar label={UI_KIT.feedback.downloadProgress} value={64} />
          <ProgressBar indeterminate label={UI_KIT.feedback.processingDownload} />
          <div className="flex items-center gap-3">
            <Spinner />
            <span className="text-fg-muted text-xs">{UI_KIT.feedback.loadingState}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => showToast(UI_KIT.feedback.toastMessage)}>
              {UI_KIT.feedback.showToast}
            </Button>
            <Button onClick={() => setDialogOpen(true)} variant="danger">
              {UI_KIT.feedback.showConfirm}
            </Button>
          </div>
        </section>
      </Card>

      <EmptyState
        actionLabel={UI_KIT.feedback.emptyAction}
        description={UI_KIT.feedback.emptyDescription}
        icon={PackageOpen}
        onAction={() => showToast(UI_KIT.feedback.settingsSelected)}
        title={UI_KIT.feedback.emptyTitle}
      />

      <ConfirmDialog
        description={UI_KIT.feedback.confirmDescription}
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false)
          showToast(UI_KIT.feedback.actionConfirmed)
        }}
        open={dialogOpen}
        title={UI_KIT.feedback.confirmTitle}
      />
    </div>
  )
}
