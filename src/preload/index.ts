import type { AppPlatform, HaApi } from '@shared/ipc/api'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { Result } from '@shared/types/result'
import { contextBridge, ipcRenderer } from 'electron'

function platform(): AppPlatform {
  return process.platform === 'darwin' ? 'darwin' : 'win32'
}

const api: HaApi = {
  system: {
    getPlatform: platform,
    getVersion: () =>
      ipcRenderer.invoke(IPC_CHANNELS.system.getVersion, undefined) as Promise<Result<string>>,
    openExternal: (url) =>
      ipcRenderer.invoke(IPC_CHANNELS.system.openExternal, { url }) as Promise<Result<undefined>>,
  },
  window: {
    close: () =>
      ipcRenderer.invoke(IPC_CHANNELS.window.close, undefined) as Promise<Result<undefined>>,
    isMaximized: () =>
      ipcRenderer.invoke(IPC_CHANNELS.window.isMaximized, undefined) as Promise<Result<boolean>>,
    minimize: () =>
      ipcRenderer.invoke(IPC_CHANNELS.window.minimize, undefined) as Promise<Result<undefined>>,
    onMaximizedChange: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean): void => {
        listener(isMaximized)
      }
      ipcRenderer.on(IPC_CHANNELS.window.maximizeChanged, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.window.maximizeChanged, handler)
    },
    toggleMaximize: () =>
      ipcRenderer.invoke(IPC_CHANNELS.window.toggleMaximize, undefined) as Promise<Result<boolean>>,
  },
}

contextBridge.exposeInMainWorld('api', api)
