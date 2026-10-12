import { app, type BrowserWindow, session } from 'electron'

import { registerIpc } from './ipc/register-ipc'
import { publishMaximizeState } from './ipc/window'
import { logger } from './logger'
import { installApplicationMenu } from './menu'
import { appIconPath } from './resources'
import { installContentSecurityPolicy } from './security/csp'
import { AppServices } from './services/app-services'
import { copyDiagnosticInfo, openLicenseNotices, openLogsFolder } from './services/system-actions'
import { activeDownloadCount, installCloseGuard } from './window/close-guard'
import { createMainWindow } from './window/create-main-window'

const isDevelopment = !app.isPackaged
let mainWindow: BrowserWindow | null = null
let services: AppServices | undefined

app.name = 'HA Premium Video Downloader'
app.setAppUserModelId('com.hussainislive.havideodownloader')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app
    .whenReady()
    .then(() => {
      if (isDevelopment && process.platform === 'darwin') app.dock?.setIcon(appIconPath())
      installContentSecurityPolicy(session.defaultSession, isDevelopment)
      mainWindow = createMainWindow()
      const appServices = new AppServices(() => mainWindow)
      services = appServices
      installApplicationMenu(isDevelopment, {
        copyDiagnosticInfo: () => copyDiagnosticInfo(appServices),
        openLicenses: openLicenseNotices,
        openLogsFolder,
      })
      registerIpc(() => mainWindow, services)
      publishMaximizeState(mainWindow)
      installCloseGuard(mainWindow, {
        activeCount: () => activeDownloadCount(services?.downloads?.snapshot()),
        shutdown: () => services?.shutdown() ?? Promise.resolve(),
      })
      void services.ready.then(() => {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.setAlwaysOnTop(services?.settings.value.keepWindowOnTop ?? false)
      })
      mainWindow.on('closed', () => {
        mainWindow = null
      })
    })
    .catch((error: unknown) => {
      logger.error('Application startup failed', error)
      app.quit()
    })
}

app.on('window-all-closed', () => {
  app.quit()
})
