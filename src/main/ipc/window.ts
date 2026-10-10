import { IPC_CHANNELS } from '@shared/ipc/channels'
import { EmptyInputSchema } from '@shared/ipc/schemas'
import { err, ok, type Result } from '@shared/types/result'
import { type BrowserWindow, ipcMain } from 'electron'

type WindowGetter = () => BrowserWindow | null

function invalidInput(): Result<never> {
  return err({
    code: 'INVALID_REQUEST',
    message: 'The window request was not valid.',
    retryable: false,
  })
}

export function registerWindowIpc(getWindow: WindowGetter): void {
  ipcMain.handle(IPC_CHANNELS.window.minimize, (_event, input): Result<undefined> => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidInput()
    getWindow()?.minimize()
    return ok(undefined)
  })

  ipcMain.handle(IPC_CHANNELS.window.toggleMaximize, (_event, input): Result<boolean> => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidInput()
    const window = getWindow()
    if (!window) return ok(false)
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
    return ok(window.isMaximized())
  })

  ipcMain.handle(IPC_CHANNELS.window.isMaximized, (_event, input): Result<boolean> => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidInput()
    return ok(getWindow()?.isMaximized() ?? false)
  })

  ipcMain.handle(IPC_CHANNELS.window.close, (_event, input): Result<undefined> => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidInput()
    getWindow()?.close()
    return ok(undefined)
  })
}

export function publishMaximizeState(window: BrowserWindow): void {
  const publish = (): void => {
    window.webContents.send(IPC_CHANNELS.window.maximizeChanged, window.isMaximized())
  }
  window.on('maximize', publish)
  window.on('unmaximize', publish)
}
