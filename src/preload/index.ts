import type { AppPlatform, HaApi, NavigationTarget } from '@shared/ipc/api'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { DownloadSnapshot, EnqueueDownloadInput } from '@shared/types/download'
import type { EngineStatus } from '@shared/types/engine'
import type { LibraryItem, LibrarySearchInput } from '@shared/types/history'
import type { Result } from '@shared/types/result'
import type { Settings, SettingsUpdate } from '@shared/types/settings'
import { contextBridge, ipcRenderer } from 'electron'

function platform(): AppPlatform {
  return process.platform === 'darwin' ? 'darwin' : 'win32'
}

function invoke<T>(channel: string, input: unknown = undefined): Promise<Result<T>> {
  return ipcRenderer.invoke(channel, input) as Promise<Result<T>>
}

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T): void => listener(value)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: HaApi = {
  clipboard: {
    readUrl: () => invoke(IPC_CHANNELS.clipboard.readUrl),
    writeText: (text) => invoke(IPC_CHANNELS.clipboard.writeText, { text }),
  },
  dialog: { chooseFolder: () => invoke(IPC_CHANNELS.dialog.chooseFolder) },
  disk: { getFreeBytes: (path) => invoke(IPC_CHANNELS.disk.getFreeBytes, { path }) },
  downloads: {
    cancel: (id) => invoke(IPC_CHANNELS.downloads.cancel, { id }),
    clearCompleted: () => invoke(IPC_CHANNELS.downloads.clearCompleted),
    enqueue: (input: EnqueueDownloadInput) => invoke(IPC_CHANNELS.downloads.enqueue, input),
    list: () => invoke(IPC_CHANNELS.downloads.list),
    pause: (id) => invoke(IPC_CHANNELS.downloads.pause, { id }),
    remove: (id) => invoke(IPC_CHANNELS.downloads.remove, { id }),
    resume: (id) => invoke(IPC_CHANNELS.downloads.resume, { id }),
    retry: (id) => invoke(IPC_CHANNELS.downloads.retry, { id }),
    onUpdated: (listener) => subscribe<DownloadSnapshot>(IPC_CHANNELS.downloads.updated, listener),
  },
  engine: {
    checkUpdate: () => invoke(IPC_CHANNELS.engine.checkUpdate),
    getStatus: () => invoke(IPC_CHANNELS.engine.getStatus),
    onStatusChanged: (listener) =>
      subscribe<EngineStatus>(IPC_CHANNELS.engine.statusChanged, listener),
  },
  library: {
    delete: (id, deleteFile) => invoke(IPC_CHANNELS.library.delete, { id, deleteFile }),
    list: () => invoke(IPC_CHANNELS.library.list),
    search: (input: LibrarySearchInput) => invoke(IPC_CHANNELS.library.search, input),
    onUpdated: (listener) => subscribe<LibraryItem[]>(IPC_CHANNELS.library.updated, listener),
  },
  media: {
    cancelProbe: () => invoke(IPC_CHANNELS.media.cancelProbe),
    probe: (url) => invoke(IPC_CHANNELS.media.probe, { url }),
  },
  settings: {
    get: () => invoke(IPC_CHANNELS.settings.get),
    resetDownloadDir: () => invoke(IPC_CHANNELS.settings.resetDownloadDir),
    update: (update: SettingsUpdate) => invoke(IPC_CHANNELS.settings.update, update),
    onUpdated: (listener) => subscribe<Settings>(IPC_CHANNELS.settings.updated, listener),
  },
  shell: {
    openFile: (path) => invoke(IPC_CHANNELS.shell.openFile, { path }),
    showInFolder: (path) => invoke(IPC_CHANNELS.shell.showInFolder, { path }),
  },
  system: {
    copyDiagnosticInfo: () => invoke(IPC_CHANNELS.system.copyDiagnosticInfo),
    getPlatform: platform,
    getStartupNotices: () => invoke(IPC_CHANNELS.system.getStartupNotices),
    getVersion: () => invoke(IPC_CHANNELS.system.getVersion),
    onNavigate: (listener) => subscribe<NavigationTarget>(IPC_CHANNELS.system.navigate, listener),
    openExternal: (url) => invoke(IPC_CHANNELS.system.openExternal, { url }),
    openLicenses: () => invoke(IPC_CHANNELS.system.openLicenses),
  },
  window: {
    close: () => invoke(IPC_CHANNELS.window.close),
    isMaximized: () => invoke(IPC_CHANNELS.window.isMaximized),
    minimize: () => invoke(IPC_CHANNELS.window.minimize),
    onMaximizedChange: (listener) =>
      subscribe<boolean>(IPC_CHANNELS.window.maximizeChanged, listener),
    toggleMaximize: () => invoke(IPC_CHANNELS.window.toggleMaximize),
  },
}

contextBridge.exposeInMainWorld('api', api)

if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('__ha', {
    api,
    snapshot: () => api.downloads.list(),
    probe: (url: string) => api.media.probe(url),
  })
}
