import { IPC_CHANNELS } from '@shared/ipc/channels'
import {
  EmptyInputSchema,
  EnqueueInputSchema,
  JobIdInputSchema,
  ProbeInputSchema,
} from '@shared/ipc/schemas'
import { ok } from '@shared/types/result'
import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'

import type { AppServices } from '../services/app-services'
import { assertWritableDirectory } from '../services/disk'
import { invalidRequest, ipcFailure, safeSend } from './helpers'

type WindowGetter = () => BrowserWindow | null

export function registerEngineIpc(services: AppServices, getWindow: WindowGetter): void {
  ipcMain.handle(IPC_CHANNELS.engine.getStatus, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      return ok(services.binaries.status)
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.engine.checkUpdate, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      const result = await services.updater?.checkAndUpdate()
      safeSend(getWindow(), IPC_CHANNELS.engine.statusChanged, services.binaries.status)
      return result ?? ipcFailure(new Error('Updater unavailable'))
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.media.probe, async (_event, input) => {
    const parsed = ProbeInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      await services.ready
      return (
        (await services.probe?.probe(parsed.data.url)) ?? ipcFailure(new Error('Probe unavailable'))
      )
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.media.cancelProbe, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      await services.probe?.cancel()
      return ok(undefined)
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.downloads.list, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      return ok(services.downloads?.snapshot())
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.downloads.enqueue, async (_event, input) => {
    const parsed = EnqueueInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      await services.ready
      await assertWritableDirectory(parsed.data.outputDir)
      return ok(services.downloads?.enqueue(parsed.data))
    } catch (error) {
      return ipcFailure(error)
    }
  })

  const action = (channel: string, method: 'pause' | 'resume' | 'cancel' | 'retry'): void => {
    ipcMain.handle(channel, async (_event, input) => {
      const parsed = JobIdInputSchema.safeParse(input)
      if (!parsed.success) return invalidRequest()
      try {
        await services.ready
        const manager = services.downloads
        if (!manager) throw new Error('Download manager unavailable')
        return ok(await manager[method](parsed.data.id))
      } catch (error) {
        return ipcFailure(error)
      }
    })
  }
  action(IPC_CHANNELS.downloads.pause, 'pause')
  action(IPC_CHANNELS.downloads.resume, 'resume')
  action(IPC_CHANNELS.downloads.cancel, 'cancel')
  action(IPC_CHANNELS.downloads.retry, 'retry')

  ipcMain.handle(IPC_CHANNELS.downloads.remove, async (_event, input) => {
    const parsed = JobIdInputSchema.safeParse(input)
    if (!parsed.success) return invalidRequest()
    try {
      await services.ready
      return ok(services.downloads?.remove(parsed.data.id))
    } catch (error) {
      return ipcFailure(error)
    }
  })
  ipcMain.handle(IPC_CHANNELS.downloads.clearCompleted, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      return ok(services.downloads?.clearCompleted())
    } catch (error) {
      return ipcFailure(error)
    }
  })

  void services.ready.then(() => {
    services.downloads?.subscribe((snapshot) =>
      safeSend(getWindow(), IPC_CHANNELS.downloads.updated, snapshot),
    )
    safeSend(getWindow(), IPC_CHANNELS.engine.statusChanged, services.binaries.status)
  })
}
