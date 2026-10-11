import { useLibraryStore } from '@renderer/store/library-store'
import { useEffect } from 'react'

export function useLibrarySync(): void {
  useEffect(() => {
    const refresh = async (): Promise<void> => {
      const result = await window.api.library.list()
      if (result.ok) useLibraryStore.getState().setItems(result.value)
      else useLibraryStore.getState().setError(result.error.message)
    }
    const unsubscribe = window.api.library.onUpdated((items) => {
      useLibraryStore.getState().setItems(items)
    })
    const handleFocus = (): void => void refresh()
    window.addEventListener('focus', handleFocus)
    void refresh()
    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
}
