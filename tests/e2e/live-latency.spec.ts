import { stat } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const samples = [
  { site: 'Facebook', url: 'https://www.facebook.com/reel/4849851438576607', audio: false },
  { site: 'Instagram', url: 'https://www.instagram.com/reels/DeZoZfhIEdf/', audio: false },
  { site: 'YouTube', url: 'https://www.youtube.com/watch?v=45EGiEei1mc', audio: true },
] as const

test.describe.serial('owner-supplied real-site latency @live', () => {
  test.setTimeout(300_000)
  let launched: LaunchedApp | null = null

  test.beforeAll(async () => {
    test.skip(process.platform !== 'darwin', 'The macOS fast-runtime gate runs on macOS')
    launched = await launchElectronApp({ settings: { embedMetadata: false } })
  })

  test.afterAll(async () => {
    await closeElectronApp(launched)
    launched = null
  })

  test('previews and downloads all three links through the real Electron UI @live', async () => {
    if (!launched) throw new Error('Electron app was not launched')
    const { page } = launched
    await expect(page.getByText('Engine Ready')).toBeVisible({ timeout: 90_000 })
    for (const [index, sample] of samples.entries()) {
      const started = Date.now()
      await page.getByLabel('Video or audio link').fill(sample.url)
      await expect(page.getByTestId('media-preview')).toBeVisible({ timeout: 90_000 })
      const previewMs = Date.now() - started
      if (sample.audio) await page.getByRole('button', { name: 'Audio' }).click()
      const queuedAt = Date.now()
      await page.getByRole('button', { name: /^Download Now/u }).click()
      await page.getByRole('tab', { name: /Queue/u }).click()
      await expect(page.locator('[data-state="completed"]')).toHaveCount(index + 1, {
        timeout: 120_000,
      })
      const downloadMs = Date.now() - queuedAt
      const snapshot = await page.evaluate(() => window.api.downloads.list())
      if (!snapshot.ok) throw new Error(snapshot.error.message)
      const job = snapshot.value.jobs.find((candidate) => candidate.url === sample.url)
      expect(job?.usedCachedProbe).toBe(true)
      expect(job?.filePath).toBeTruthy()
      expect((await stat(job?.filePath ?? '')).size).toBeGreaterThan(0)
      if (sample.audio) expect(job?.filePath).toMatch(/\.mp3$/u)
      process.stdout.write(`${sample.site}: preview ${previewMs} ms, download ${downloadMs} ms\n`)
      await page.getByRole('tab', { name: /Downloader/u }).click()
    }
  })
})
