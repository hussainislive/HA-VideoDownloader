import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
let launched: LaunchedApp | null = null

function current(): LaunchedApp {
  if (!launched) throw new Error('Electron test app was not launched')
  return launched
}

async function pasteUrl(url: string): Promise<void> {
  const { app, page } = current()
  await app.evaluate(({ clipboard }, value) => clipboard.writeText(value), url)
  await page.getByRole('button', { name: 'Paste' }).click()
  await expect(page.getByTestId('media-preview')).toBeVisible()
}

async function addFromDownloader(url: string): Promise<void> {
  const { page } = current()
  await pasteUrl(url)
  await page.getByRole('button', { name: /^Download Now/u }).click()
  await expect(page.getByText('Added to queue')).toBeVisible()
}

test.beforeEach(async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
  })
})

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('pastes, probes, selects 1080p MP4, downloads, and opens the folder', async () => {
  const { app, page } = current()
  await app.evaluate(({ shell }) => {
    const scope = globalThis as typeof globalThis & { __haShownInFolder?: string }
    shell.showItemInFolder = (path): void => {
      scope.__haShownInFolder = path
    }
  })
  await addFromDownloader('https://example.test/golden')
  await expect(page.getByRole('tab', { name: /Queue/u }).getByText('1')).toBeVisible()
  await page.getByRole('button', { name: 'View Queue' }).click()
  await expect(page.locator('[data-state="completed"]')).toBeVisible()
  await expect(page.getByText('Download completed: Fake Video')).toBeVisible()
  await page.getByRole('button', { name: 'Open Folder' }).click()
  await expect
    .poll(() =>
      app.evaluate(() => {
        const scope = globalThis as typeof globalThis & { __haShownInFolder?: string }
        return scope.__haShownInFolder
      }),
    )
    .toContain('Fake Video [fake-id].mp4')
})

test('pauses, resumes, and confirms cancellation after progress', async () => {
  const { page } = current()
  await addFromDownloader('https://example.test/slow')
  await page.getByRole('button', { name: 'View Queue' }).click()
  const card = page.locator('[data-job-id]')
  await expect(card).toHaveAttribute('data-state', 'downloading')
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(card).toHaveAttribute('data-state', 'paused')
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(card).toHaveAttribute('data-state', 'downloading')
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cancel this download?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).last().click()
  await expect(card).toHaveAttribute('data-state', 'canceled')
})

test('shows a friendly failure and retries it', async () => {
  const { page } = current()
  await addFromDownloader('https://example.test/crash')
  await page.getByRole('button', { name: 'View Queue' }).click()
  const card = page.locator('[data-job-id]')
  await expect(card).toHaveAttribute('data-state', 'failed')
  await expect(page.getByText('The download engine reported an unexpected problem.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Update Engine' })).toBeVisible()
  const firstAttempt = await page.evaluate(async () => {
    const snapshot = await window.api.downloads.list()
    return snapshot.ok ? snapshot.value.jobs[0]?.attempt : undefined
  })
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(card).toHaveAttribute('data-state', 'failed')
  await expect
    .poll(async () => {
      const snapshot = await page.evaluate(() => window.api.downloads.list())
      return snapshot.ok ? snapshot.value.jobs[0]?.attempt : undefined
    })
    .toBe((firstAttempt ?? 0) + 1)
})

test('extracts audio through the same queue flow', async () => {
  const { page, userData } = current()
  await pasteUrl('https://example.test/audio')
  await page.getByRole('button', { name: 'Audio' }).click()
  await page.getByRole('button', { name: /^Download Now/u }).click()
  await page.getByRole('button', { name: 'View Queue' }).click()
  await expect(page.locator('[data-state="completed"]')).toBeVisible()
  await expect
    .poll(async () => {
      const directory = join(userData, 'downloads')
      await mkdir(directory, { recursive: true })
      return page
        .evaluate(() => window.api.downloads.list())
        .then((result) => (result.ok ? result.value.jobs[0]?.filePath : undefined))
    })
    .toMatch(/\.mp3$/u)
})

test('cancels an obsolete probe when the URL changes', async () => {
  const { page } = current()
  const input = page.getByLabel('Video or audio link')
  await input.fill('https://example.test/slow-probe')
  await expect(page.getByTestId('url-card').getByText('Reading link…')).toBeVisible()
  await input.fill('https://example.test/replacement')
  await expect(page.getByTestId('media-preview')).toContainText('Fake Video')
  await expect(input).toHaveValue('https://example.test/replacement')
})
