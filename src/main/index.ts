import { app, type BrowserWindow, session } from 'electron'

import { registerIpc } from './ipc/register-ipc'
import { publishMaximizeState } from './ipc/window'
import { logger } from './logger'
import { installApplicationMenu } from './menu'
import { installContentSecurityPolicy } from './security/csp'
import { createMainWindow } from './window/create-main-window'

const isDevelopment = !app.isPackaged
let mainWindow: BrowserWindow | null = null

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
      registerIpc(() => mainWindow)
      mainWindow = createMainWindow()
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
