import type { DownloadJob, DownloadSnapshot, EnqueueDownloadInput } from '../types/download'
import type { EngineStatus, EngineUpdateResult } from '../types/engine'
import type { LibraryItem, LibrarySearchInput } from '../types/history'
import type { MediaInfo } from '../types/media'
import type { Result } from '../types/result'
import type { Settings, SettingsUpdate } from '../types/settings'

export type AppPlatform = 'darwin' | 'win32'
export type NavigationTarget = 'queue' | 'settings'

export interface HaApi {
  clipboard: {
    readUrl: () => Promise<Result<string | undefined>>
    writeText: (text: string) => Promise<Result<undefined>>
  }
  dialog: { chooseFolder: () => Promise<Result<string | undefined>> }
  disk: { getFreeBytes: (path: string) => Promise<Result<number>> }
  downloads: {
    cancel: (id: string) => Promise<Result<DownloadJob>>
    clearCompleted: () => Promise<Result<DownloadSnapshot>>
    enqueue: (input: EnqueueDownloadInput) => Promise<Result<DownloadJob>>
    list: () => Promise<Result<DownloadSnapshot>>
    pause: (id: string) => Promise<Result<DownloadJob>>
    remove: (id: string) => Promise<Result<DownloadSnapshot>>
    resume: (id: string) => Promise<Result<DownloadJob>>
    retry: (id: string) => Promise<Result<DownloadJob>>
    onUpdated: (listener: (snapshot: DownloadSnapshot) => void) => () => void
  }
  engine: {
    checkUpdate: () => Promise<Result<EngineUpdateResult>>
    getStatus: () => Promise<Result<EngineStatus>>
    onStatusChanged: (listener: (status: EngineStatus) => void) => () => void
  }
  library: {
    delete: (id: string, deleteFile: boolean) => Promise<Result<LibraryItem[]>>
    list: () => Promise<Result<LibraryItem[]>>
    search: (input: LibrarySearchInput) => Promise<Result<LibraryItem[]>>
    onUpdated: (listener: (items: LibraryItem[]) => void) => () => void
  }
  media: {
    cancelProbe: () => Promise<Result<undefined>>
    probe: (url: string) => Promise<Result<MediaInfo>>
  }
  settings: {
    get: () => Promise<Result<Settings>>
    resetDownloadDir: () => Promise<Result<Settings>>
    update: (update: SettingsUpdate) => Promise<Result<Settings>>
    onUpdated: (listener: (settings: Settings) => void) => () => void
  }
  shell: {
    openFile: (path: string) => Promise<Result<undefined>>
    showInFolder: (path: string) => Promise<Result<undefined>>
  }
  system: {
    getPlatform: () => AppPlatform
    getStartupNotices: () => Promise<Result<string[]>>
    getVersion: () => Promise<Result<string>>
    onNavigate: (listener: (target: NavigationTarget) => void) => () => void
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
