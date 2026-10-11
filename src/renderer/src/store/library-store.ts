import type { LibraryItem } from '@shared/types/history'
import { create } from 'zustand'

type LibraryHydration = 'loading' | 'ready' | 'error'

interface LibraryStoreState {
  error: string | undefined
  hydration: LibraryHydration
  items: readonly LibraryItem[]
  setError: (message: string) => void
  setItems: (items: readonly LibraryItem[]) => void
}

export const useLibraryStore = create<LibraryStoreState>((set) => ({
  error: undefined,
  hydration: 'loading',
  items: [],
  setError: (error) => set({ error, hydration: 'error' }),
  setItems: (items) => set({ error: undefined, hydration: 'ready', items }),
}))
