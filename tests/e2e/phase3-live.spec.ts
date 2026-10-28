import { access, stat } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const videoUrl = 'https://commons.wikimedia.org/wiki/File:Test-webM.webm'
let launched: LaunchedApp | null = null

test.describe('Phase 3 real UI smoke @live', () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async () => {
    test.skip(
      process.platform !== 'darwin' && process.platform !== 'win32',
      'Live UI smoke runs on macOS or Windows',
    )
    launched = await launchElectronApp({
      settings: { defaultContainer: 'mkv', defaultQuality: 480, embedMetadata: false },
    })
  })

  test.afterEach(async () => {
    await closeElectronApp(launched)
    launched = null
  })

  test('probes and downloads a short Creative Commons video through the UI @live', async () => {
    if (!launched) throw new Error('Electron test app was not launched')
    const { page } = launched
    const engineStatus = await page.evaluate(() => window.api.engine.getStatus())
    if (!engineStatus.ok || !engineStatus.value.ok) throw new Error(JSON.stringify(engineStatus))
    await page.getByLabel('Video or audio link').fill(videoUrl)
    await expect(page.getByTestId('media-preview')).toBeVisible({ timeout: 90_000 })
    await page.getByRole('button', { name: /^Download Now/u }).click()
    await page.getByRole('button', { name: 'View Queue' }).click()
    await expect(page.locator('[data-state="completed"]')).toHaveCount(1, { timeout: 120_000 })
    const snapshot = await page.evaluate(() => window.api.downloads.list())
    if (!snapshot.ok) throw new Error(snapshot.error.message)
    const completed = snapshot.value.jobs.find(({ state }) => state === 'completed')
    expect(completed?.filePath).toBeTruthy()
    const filePath = completed?.filePath ?? ''
    await expect(access(filePath)).resolves.toBeUndefined()
    expect((await stat(filePath)).size).toBeGreaterThan(0)
    const library = await page.evaluate(() => window.api.library.list())
    if (!library.ok) throw new Error(library.error.message)
    expect(library.value.find(({ id }) => id === completed?.id)?.filePath).toBe(filePath)
  })
})
