import type { BrowserWindow } from 'electron'

import { registerSystemIpc } from './system'
import { registerWindowIpc } from './window'

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  registerSystemIpc()
  registerWindowIpc(getWindow)
}
