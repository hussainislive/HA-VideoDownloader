import type { EngineStatus } from '@shared/types/engine'
import { create } from 'zustand'

interface EngineStoreState {
  error: string | undefined
  loading: boolean
  setError: (message: string) => void
  setStatus: (status: EngineStatus) => void
  status: EngineStatus | undefined
}

export const useEngineStore = create<EngineStoreState>((set) => ({
  error: undefined,
  loading: true,
  status: undefined,
  setError: (error) => set({ error, loading: false }),
  setStatus: (status) => set({ error: undefined, loading: false, status }),
}))
