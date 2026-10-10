import type { Result } from '../types/result'

export type AppPlatform = 'darwin' | 'win32'

export interface HaApi {
  system: {
    getPlatform: () => AppPlatform
    getVersion: () => Promise<Result<string>>
    openExternal: (url: string) => Promise<Result<undefined>>
  }
  window: {
    close: () => Promise<Result<undefined>>
    isMaximized: () => Promise<Result<boolean>>
    minimize: () => Promise<Result<undefined>>
    onMaximizedChange: (listener: (isMaximized: boolean) => void) => () => void
    toggleMaximize: () => Promise<Result<boolean>>
  }
}
