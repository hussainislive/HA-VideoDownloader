import { useDownloadStore } from '@renderer/store/download-store'
import { useEngineStore } from '@renderer/store/engine-store'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useEffect } from 'react'

export function useAppSync(): void {
  useEffect(() => {
    const downloads = useDownloadStore.getState()
    const settings = useSettingsStore.getState()
    const unsubscribeDownloads = window.api.downloads.onUpdated((snapshot) => {
      useDownloadStore.getState().applySnapshot(snapshot)
    })
    const unsubscribeSettings = window.api.settings.onUpdated((value) => {
      useSettingsStore.getState().setSettings(value)
    })
    const unsubscribeEngine = window.api.engine.onStatusChanged((status) => {
      useEngineStore.getState().setStatus(status)
    })

    void window.api.downloads.list().then((result) => {
      if (result.ok) useDownloadStore.getState().applySnapshot(result.value)
      else downloads.setError(result.error.message)
    })
    void window.api.settings.get().then((result) => {
      if (result.ok) useSettingsStore.getState().setSettings(result.value)
      else settings.setError(result.error.message)
    })
    void window.api.engine.getStatus().then((result) => {
      if (result.ok) useEngineStore.getState().setStatus(result.value)
      else useEngineStore.getState().setError(result.error.message)
    })

    return () => {
      unsubscribeDownloads()
      unsubscribeEngine()
      unsubscribeSettings()
    }
  }, [])
}
