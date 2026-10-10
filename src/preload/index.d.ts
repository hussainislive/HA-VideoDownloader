import type { HaApi } from '../shared/ipc/api'

declare global {
  interface Window {
    api: HaApi
  }
}

export {}
