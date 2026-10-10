import type { HaApi } from '../shared/ipc/api'

declare global {
  interface Window {
    api: HaApi
    __ha?: {
      api: HaApi
      snapshot: HaApi['downloads']['list']
      probe: HaApi['media']['probe']
    }
  }
}

export {}
