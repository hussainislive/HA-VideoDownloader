import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

import type { HistoryItem } from '../../src/shared/types/history'
import type { Settings } from '../../src/shared/types/settings'

export interface LaunchedApp {
  app: ElectronApplication
  page: Page
  userData: string
}

export interface LaunchOptions {
  env?: NodeJS.ProcessEnv
  history?: readonly HistoryItem[]
  settings?: Partial<Settings>
  userData?: string
}

export async function launchElectronApp(options: LaunchOptions = {}): Promise<LaunchedApp> {
  const userData = options.userData ?? (await mkdtemp(join(tmpdir(), 'ha-downloader-e2e-')))
  await mkdir(userData, { recursive: true })
  if (options.settings) {
    const downloadDir = options.settings.downloadDir ?? join(userData, 'downloads')
    await mkdir(downloadDir, { recursive: true })
    const settings: Settings = {
      schemaVersion: 2,
      downloadDir,
      defaultKind: 'video',
      defaultQuality: 1080,
      defaultContainer: 'mp4',
      defaultAudioFormat: 'mp3',
      defaultAudioBitrate: 320,
      maxConcurrent: 2,
      autoPasteClipboard: false,
      notifyOnComplete: false,
      embedMetadata: true,
      keepWindowOnTop: false,
      ...options.settings,
    }
    await writeFile(join(userData, 'settings.json'), JSON.stringify(settings))
  }
  if (options.history) {
    await writeFile(
      join(userData, 'history.json'),
      JSON.stringify({ schemaVersion: 1, items: options.history }),
    )
  }
  const environment = { ...process.env }
  delete environment.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({
    args: [process.cwd(), `--user-data-dir=${userData}`],
    env: {
      ...environment,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      NODE_ENV: 'test',
      ...options.env,
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

export async function closeElectronApp(
  launched: LaunchedApp | null,
  preserveUserData = false,
): Promise<void> {
  if (!launched) return
  await launched.app
    .evaluate(({ dialog }) => {
      dialog.showMessageBox = (): Promise<Electron.MessageBoxReturnValue> =>
        Promise.resolve({ response: 1, checkboxChecked: false })
    })
    .catch(() => undefined)
  await launched.app.close().catch(() => undefined)
  if (!preserveUserData) await rm(launched.userData, { force: true, recursive: true })
}
