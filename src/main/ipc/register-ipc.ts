import type { BrowserWindow } from 'electron'

import type { AppServices } from '../services/app-services'
import { registerEngineIpc } from './engine'
import { registerServiceIpc } from './services'
import { registerSystemIpc } from './system'
import { registerWindowIpc } from './window'

export function registerIpc(getWindow: () => BrowserWindow | null, services: AppServices): void {
  registerSystemIpc(services)
  registerWindowIpc(getWindow)
  registerEngineIpc(services, getWindow)
  registerServiceIpc(services, getWindow)
}
