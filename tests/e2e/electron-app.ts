import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

export interface LaunchedApp {
  app: ElectronApplication
  page: Page
  userData: string
}

export async function launchElectronApp(): Promise<LaunchedApp> {
  const userData = await mkdtemp(join(tmpdir(), 'ha-downloader-e2e-'))
  const environment = { ...process.env }
  delete environment.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({
    args: [join(process.cwd(), 'out/main/index.js'), `--user-data-dir=${userData}`],
    env: {
      ...environment,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      NODE_ENV: 'test',
    },
  })
  try {
    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('app-shell').waitFor({ state: 'visible' })
    return { app, page, userData }
  } catch (error) {
    await app.close().catch(() => undefined)
    await rm(userData, { force: true, recursive: true })
    throw error
  }
}

export async function closeElectronApp(launched: LaunchedApp | null): Promise<void> {
  if (!launched) return
  await launched.app.close().catch(() => undefined)
  await rm(launched.userData, { force: true, recursive: true })
}
