import { app, type BrowserWindow, session } from 'electron'

import { registerIpc } from './ipc/register-ipc'
import { publishMaximizeState } from './ipc/window'
import { logger } from './logger'
import { installApplicationMenu } from './menu'
import { installContentSecurityPolicy } from './security/csp'
import { AppServices } from './services/app-services'
import { createMainWindow } from './window/create-main-window'

const isDevelopment = !app.isPackaged
let mainWindow: BrowserWindow | null = null
let services: AppServices | undefined
let shutdownStarted = false

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
      installContentSecurityPolicy(session.defaultSession, isDevelopment)
      installApplicationMenu(isDevelopment)
      mainWindow = createMainWindow()
      services = new AppServices(() => mainWindow)
      registerIpc(() => mainWindow, services)
      publishMaximizeState(mainWindow)
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

app.on('before-quit', (event) => {
  if (!services || shutdownStarted) return
  event.preventDefault()
  shutdownStarted = true
  void services
    .shutdown()
    .catch((error: unknown) => logger.error('Application shutdown failed', error))
    .finally(() => app.quit())
})
