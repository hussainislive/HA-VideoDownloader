import type { DownloadJob, DownloadSnapshot, EnqueueDownloadInput } from '../types/download'
import type { EngineStatus, EngineUpdateResult } from '../types/engine'
import type { HistoryItem, LibrarySearchInput } from '../types/history'
import type { MediaInfo } from '../types/media'
import type { Result } from '../types/result'
import type { Settings, SettingsUpdate } from '../types/settings'

export type AppPlatform = 'darwin' | 'win32'

export interface HaApi {
  clipboard: { readUrl: () => Promise<Result<string | undefined>> }
  dialog: { chooseFolder: () => Promise<Result<string | undefined>> }
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
    delete: (id: string, deleteFile: boolean) => Promise<Result<HistoryItem[]>>
    list: () => Promise<Result<HistoryItem[]>>
    search: (input: LibrarySearchInput) => Promise<Result<HistoryItem[]>>
    onUpdated: (listener: (items: HistoryItem[]) => void) => () => void
  }
  media: { probe: (url: string) => Promise<Result<MediaInfo>> }
  settings: {
    get: () => Promise<Result<Settings>>
    update: (update: SettingsUpdate) => Promise<Result<Settings>>
    onUpdated: (listener: (settings: Settings) => void) => () => void
  }
  shell: {
    openFile: (path: string) => Promise<Result<undefined>>
    showInFolder: (path: string) => Promise<Result<undefined>>
  }
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
