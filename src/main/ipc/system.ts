import { IPC_CHANNELS } from '@shared/ipc/channels'
import { EmptyInputSchema, OpenExternalInputSchema } from '@shared/ipc/schemas'
import { err, ok, type Result } from '@shared/types/result'
import { app, ipcMain, shell } from 'electron'

import { logger } from '../logger'
import { isAllowedExternalUrl } from '../security/external-url'
import type { AppServices } from '../services/app-services'
import { copyDiagnosticInfo, openLicenseNotices } from '../services/system-actions'

export function registerSystemIpc(services: AppServices): void {
  ipcMain.handle(IPC_CHANNELS.system.copyDiagnosticInfo, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    return runSystemAction(
      () => copyDiagnosticInfo(services),
      'Unable to copy diagnostic information',
      'Diagnostic information could not be copied.',
    )
  })

  ipcMain.handle(IPC_CHANNELS.system.getStartupNotices, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    try {
      await services.ready
      return ok([...services.startupNotices])
    } catch (error) {
      logger.error('Unable to read startup notices', error)
      return err({
        code: 'SYSTEM_ACTION_FAILED',
        message: 'Startup recovery details could not be loaded.',
        retryable: true,
      })
    }
  })

  ipcMain.handle(IPC_CHANNELS.system.getVersion, (_event, input): Result<string> => {
    if (!EmptyInputSchema.safeParse(input).success) {
      return err({
        code: 'INVALID_REQUEST',
        message: 'The version request was not valid.',
        retryable: false,
      })
    }
    return ok(app.getVersion())
  })

  ipcMain.handle(IPC_CHANNELS.system.openLicenses, async (_event, input) => {
    if (!EmptyInputSchema.safeParse(input).success) return invalidRequest()
    return runSystemAction(
      openLicenseNotices,
      'Unable to open license notices',
      'The license notices could not be opened.',
    )
  })

  ipcMain.handle(
    IPC_CHANNELS.system.openExternal,
    async (_event, input): Promise<Result<undefined>> => {
      const parsed = OpenExternalInputSchema.safeParse(input)
      if (!parsed.success) {
        return err({
          code: 'INVALID_REQUEST',
          message: 'That link is not valid.',
          retryable: false,
        })
      }
      if (!isAllowedExternalUrl(parsed.data.url)) {
        return err({
          code: 'EXTERNAL_URL_BLOCKED',
          message: 'This link is not approved for opening outside the app.',
          retryable: false,
        })
      }
      try {
        await shell.openExternal(parsed.data.url)
        return ok(undefined)
      } catch (error) {
        logger.error('Unable to open an approved external link', error)
        return err({
          code: 'SYSTEM_ACTION_FAILED',
          message: 'The link could not be opened.',
          retryable: true,
        })
      }
    },
  )
}

async function runSystemAction(
  action: () => Promise<void>,
  logMessage: string,
  userMessage: string,
): Promise<Result<undefined>> {
  try {
    await action()
    return ok(undefined)
  } catch (error) {
    logger.error(logMessage, error)
    return err({
      code: 'SYSTEM_ACTION_FAILED',
      message: userMessage,
      retryable: true,
    })
  }
}

function invalidRequest(): Result<never> {
  return err({
    code: 'INVALID_REQUEST',
    message: 'The system request was not valid.',
    retryable: false,
  })
}
