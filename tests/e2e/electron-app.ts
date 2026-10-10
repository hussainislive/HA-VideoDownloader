import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

import type { Settings } from '../../src/shared/types/settings'

export interface LaunchedApp {
  app: ElectronApplication
  page: Page
  userData: string
}

export interface LaunchOptions {
  env?: NodeJS.ProcessEnv
  settings?: Partial<Settings>
  userData?: string
}

export async function launchElectronApp(options: LaunchOptions = {}): Promise<LaunchedApp> {
  const userData = options.userData ?? (await mkdtemp(join(tmpdir(), 'ha-downloader-e2e-')))
  if (options.settings) {
    const downloadDir = options.settings.downloadDir ?? join(userData, 'downloads')
    await mkdir(downloadDir, { recursive: true })
    const settings: Settings = {
      schemaVersion: 1,
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
      ...options.settings,
    }
    await writeFile(join(userData, 'settings.json'), JSON.stringify(settings))
  }
  const environment = { ...process.env }
  delete environment.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({
    args: [join(process.cwd(), 'out/main/index.js'), `--user-data-dir=${userData}`],
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

export async function closeElectronApp(launched: LaunchedApp | null): Promise<void> {
  if (!launched) return
  await launched.app.close().catch(() => undefined)
  await rm(launched.userData, { force: true, recursive: true })
}
