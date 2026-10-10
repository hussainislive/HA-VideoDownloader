import { IPC_CHANNELS } from '@shared/ipc/channels'
import {
  EmptyInputSchema,
  LibraryDeleteInputSchema,
  LibrarySearchInputSchema,
  PathInputSchema,
  SettingsUpdateInputSchema,
  TextInputSchema,
} from '@shared/ipc/schemas'
import { ok } from '@shared/types/result'
import type { BrowserWindow, OpenDialogOptions } from 'electron'
import { clipboard, dialog, ipcMain } from 'electron'

import type { AppServices } from '../services/app-services'
import { firstHttpUrl } from '../services/clipboard'
import { assertWritableDirectory, getFreeBytes } from '../services/disk'
import { openFile, showInFolder } from '../services/file-actions'
import { invalidRequest, ipcFailure, safeSend } from './helpers'

type WindowGetter = () => BrowserWindow | null

export function registerServiceIpc(services: AppServices, getWindow: WindowGetter): void {
  ipcMain.handle(IPC_CHANNELS.settings.get, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      return ok(services.settings.value)
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.settings.update, async (_event, input) => {
    const parsed = SettingsUpdateInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      await services.ready
      if (parsed.data.downloadDir) await assertWritableDirectory(parsed.data.downloadDir)
      const settings = await services.settings.update(parsed.data)
      services.downloads?.setMaxConcurrent(settings.maxConcurrent)
      safeSend(getWindow(), IPC_CHANNELS.settings.updated, settings)
      return ok(settings)
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.library.list, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      return ok(services.history.list())
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.library.search, async (_event, input) => {
    const parsed = LibrarySearchInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      await services.ready
      return ok(services.history.search(parsed.data))
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.library.delete, async (_event, input) => {
    const parsed = LibraryDeleteInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      await services.ready
      const items = await services.history.delete(parsed.data.id, parsed.data.deleteFile)
      safeSend(getWindow(), IPC_CHANNELS.library.updated, items)
      return ok(items)
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.dialog.chooseFolder, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      const owner = getWindow()
      const options: OpenDialogOptions = { properties: ['openDirectory', 'createDirectory'] }
      const result = owner
        ? await dialog.showOpenDialog(owner, options)
        : await dialog.showOpenDialog(options)
      const path = result.filePaths[0]
      if (path) await assertWritableDirectory(path)
      return ok(path)
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.clipboard.readUrl, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    return ok(firstHttpUrl(await clipboard.readText()))
  })
  ipcMain.handle(IPC_CHANNELS.clipboard.writeText, async (_event, input) => {
    const parsed = TextInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    clipboard.writeText(parsed.data.text)
    return ok(undefined)
  })
  ipcMain.handle(IPC_CHANNELS.disk.getFreeBytes, async (_event, input) => {
    const parsed = PathInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      return ok(await getFreeBytes(parsed.data.path))
    } catch (error) {
      return ipcFailure(error)
    }
  })
  const pathAction = (channel: string, action: (path: string) => Promise<void>): void => {
    ipcMain.handle(channel, async (_event, input) => {
      const parsed = PathInputSchema.safeParse(input)
      if (!parsed.success) return invalidRequest()
      try {
        await action(parsed.data.path)
        return ok(undefined)
      } catch (error) {
        return ipcFailure(error)
      }
    })
  }
  pathAction(IPC_CHANNELS.shell.showInFolder, showInFolder)
  pathAction(IPC_CHANNELS.shell.openFile, openFile)
}
