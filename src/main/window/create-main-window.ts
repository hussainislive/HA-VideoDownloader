import { join } from 'node:path'

import { app, BrowserWindow } from 'electron'

import { appIconPath } from '../resources'
import { installNavigationGuards } from '../security/navigation'
import { rendererEntry } from './renderer-entry'
import { fadeInWindow } from './window-fade'
import { loadWindowState, saveWindowState } from './window-state'

const WINDOW_BACKGROUND = '#090d0a'

export function createMainWindow(): BrowserWindow {
  const state = loadWindowState()
  const isMac = process.platform === 'darwin'
  const window = new BrowserWindow({
    width: state?.width ?? 850,
    height: state?.height ?? 600,
    ...(state ? { x: state.x, y: state.y } : {}),
    minWidth: 850,
    minHeight: 600,
    show: false,
    opacity: 0,
    resizable: true,
    transparent: false,
    backgroundColor: WINDOW_BACKGROUND,
    title: 'HA Premium Video Downloader',
    titleBarStyle: 'hidden',
    frame: isMac,
    ...(isMac ? { trafficLightPosition: { x: 14, y: 16 } } : {}),
    ...(!isMac ? { icon: appIconPath() } : {}),
    autoHideMenuBar: !isMac,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  })

  if (!state) window.center()

  installNavigationGuards(window)

  window.once('ready-to-show', () => {
    if (state?.isMaximized) window.maximize()
    window.show()
    fadeInWindow(window)
  })
  window.on('close', () => {
    const bounds = window.getNormalBounds()
    saveWindowState({ ...bounds, isMaximized: window.isMaximized() })
  })

  const entry = rendererEntry(app.isPackaged, process.env.ELECTRON_RENDERER_URL)
  if (entry.kind === 'url') void window.loadURL(entry.value)
  else void window.loadFile(join(__dirname, '../renderer/index.html'))
  return window
}
