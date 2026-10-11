import type { Settings } from '@shared/types/settings'
import { create } from 'zustand'

interface SettingsStoreState {
  error: string | undefined
  settings: Settings | undefined
  setError: (message: string) => void
  setSettings: (settings: Settings) => void
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  error: undefined,
  settings: undefined,
  setError: (message) => set({ error: message }),
  setSettings: (settings) => set({ error: undefined, settings }),
}))
