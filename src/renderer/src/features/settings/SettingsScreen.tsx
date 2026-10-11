import { Spinner } from '@renderer/components/ui/Spinner'
import { useToast } from '@renderer/components/ui/Toast'
import { useFreeBytes } from '@renderer/hooks/use-free-bytes'
import { COPY } from '@renderer/lib/copy'
import { useEngineStore } from '@renderer/store/engine-store'
import { useSettingsStore } from '@renderer/store/settings-store'
import { navigateToTab } from '@renderer/store/ui-store'
import type { SettingsUpdate } from '@shared/types/settings'
import { Check, Settings2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { SettingsAboutCard } from './components/SettingsAboutCard'
import { SettingsEngineCard } from './components/SettingsEngineCard'
import { SettingsLocationCard } from './components/SettingsLocationCard'
import { SettingsPreferencesCard } from './components/SettingsPreferencesCard'

type SaveState = 'idle' | 'saving' | 'saved'

export default function SettingsScreen(): React.JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const downloadDir = settings?.downloadDir
  const freeBytes = useFreeBytes(downloadDir)
  const engine = useEngineStore((state) => state.status)
  const { showToast } = useToast()
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [updatingEngine, setUpdatingEngine] = useState(false)
  const [engineFeedback, setEngineFeedback] = useState<string>()
  const [version, setVersion] = useState<string>()
  const savedTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    void window.api.system.getVersion().then((result) => {
      if (result.ok) setVersion(result.value)
    })
  }, [])

  useEffect(
    () => () => {
      if (savedTimer.current !== undefined) window.clearTimeout(savedTimer.current)
    },
    [],
  )

  const markSaved = useCallback((): void => {
    setSaveState('saved')
    if (savedTimer.current !== undefined) window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setSaveState('idle'), 1_500)
  }, [])

  const update = useCallback(
    async (value: SettingsUpdate): Promise<void> => {
      setSaveState('saving')
      const result = await window.api.settings.update(value)
      if (result.ok) {
        useSettingsStore.getState().setSettings(result.value)
        markSaved()
      } else {
        setSaveState('idle')
        showToast(result.error.message || COPY.settings.saveFailed)
      }
    },
    [markSaved, showToast],
  )

  const chooseFolder = useCallback(async (): Promise<void> => {
    const chosen = await window.api.dialog.chooseFolder()
    if (!chosen.ok) showToast(COPY.settings.folderFailed)
    else if (chosen.value) await update({ downloadDir: chosen.value })
  }, [showToast, update])

  const resetFolder = useCallback(async (): Promise<void> => {
    setSaveState('saving')
    const result = await window.api.settings.resetDownloadDir()
    if (result.ok) {
      useSettingsStore.getState().setSettings(result.value)
      markSaved()
    } else {
      setSaveState('idle')
      showToast(result.error.message)
    }
  }, [markSaved, showToast])

  const checkEngine = useCallback(async (): Promise<void> => {
    setUpdatingEngine(true)
    setEngineFeedback(undefined)
    const result = await window.api.engine.checkUpdate()
    setUpdatingEngine(false)
    if (!result.ok) {
      setEngineFeedback(result.error.message)
      return
    }
    setEngineFeedback(
      result.value.updated
        ? COPY.settings.updated(result.value.before, result.value.after)
        : COPY.settings.upToDate,
    )
  }, [])

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={COPY.accessibility.loading} />
      </div>
    )
  }

  return (
    <div
      className="bounded-workspace mx-auto flex w-full max-w-[1200px] flex-col"
      data-testid="settings-screen"
    >
      <header className="mb-2 flex h-7 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 aria-hidden="true" className="text-accent size-4" />
          <h1 className="text-fg-heading text-sm font-bold">{COPY.tabs.settings}</h1>
        </div>
        {saveState !== 'idle' ? (
          <span
            className="text-accent flex items-center gap-1 text-[10px] font-medium"
            role="status"
          >
            {saveState === 'saved' ? <Check aria-hidden="true" className="size-3" /> : null}
            {saveState === 'saving' ? COPY.settings.saving : COPY.settings.saved}
          </span>
        ) : null}
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <div className="grid min-h-0 min-w-0 grid-rows-[auto_1fr] gap-2">
          <SettingsLocationCard
            freeBytes={freeBytes}
            onChange={() => void chooseFolder()}
            onCopy={() => {
              void window.api.clipboard.writeText(settings.downloadDir).then((result) => {
                showToast(result.ok ? COPY.settings.pathCopied : result.error.message)
              })
            }}
            onOpen={() => {
              void window.api.shell.openFile(settings.downloadDir).then((result) => {
                if (!result.ok) showToast(result.error.message)
              })
            }}
            onReset={() => void resetFolder()}
            path={settings.downloadDir}
          />
          <SettingsEngineCard
            feedback={engineFeedback}
            loading={updatingEngine}
            onUpdate={() => void checkEngine()}
            status={engine}
          />
        </div>
        <div className="grid min-h-0 min-w-0 grid-rows-[1fr_auto] gap-2">
          <SettingsPreferencesCard onUpdate={(value) => void update(value)} settings={settings} />
          <SettingsAboutCard onOpenAbout={() => navigateToTab('about')} version={version} />
        </div>
      </div>
    </div>
  )
}
