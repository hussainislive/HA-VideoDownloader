import { app, Menu } from 'electron'

import { logger } from './logger'

interface ApplicationMenuActions {
  copyDiagnosticInfo(): Promise<void>
  openLicenses(): Promise<void>
  openLogsFolder(): Promise<void>
}

export function installApplicationMenu(
  isDevelopment: boolean,
  actions: ApplicationMenuActions,
): void {
  const helpMenu: Electron.MenuItemConstructorOptions = {
    role: 'help',
    submenu: [
      {
        label: 'Copy diagnostic info',
        click: () => runMenuAction(actions.copyDiagnosticInfo, 'copy diagnostic information'),
      },
      {
        label: 'Licenses',
        click: () => runMenuAction(actions.openLicenses, 'open license notices'),
      },
      {
        label: 'Open logs folder',
        click: () => runMenuAction(actions.openLogsFolder, 'open the logs folder'),
      },
    ],
  }
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: 'Edit',
          submenu: [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }],
        },
        helpMenu,
      ]),
    )
    return
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        ...(isDevelopment
          ? ([
              { role: 'reload' },
              { role: 'toggleDevTools' },
            ] as Electron.MenuItemConstructorOptions[])
          : []),
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'front' }],
    },
    helpMenu,
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function runMenuAction(action: () => Promise<void>, description: string): void {
  void action().catch((error: unknown) => logger.error(`Unable to ${description}`, error))
}
