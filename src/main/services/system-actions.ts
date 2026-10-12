import { join } from 'node:path'

import { app, clipboard, shell } from 'electron'

import type { AppServices } from './app-services'

export async function copyDiagnosticInfo(services: AppServices): Promise<void> {
  await services.ready
  clipboard.writeText(services.diagnosticInfo())
}

export function licenseNoticesPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'licenses', 'THIRD_PARTY_NOTICES.md')
    : join(app.getAppPath(), 'THIRD_PARTY_NOTICES.md')
}

export async function openLicenseNotices(): Promise<void> {
  const failure = await shell.openPath(licenseNoticesPath())
  if (failure) throw new Error(failure)
}

export async function openLogsFolder(): Promise<void> {
  const failure = await shell.openPath(app.getPath('logs'))
  if (failure) throw new Error(failure)
}
