import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
let launched: LaunchedApp | null = null

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('confirms active-download close and offers the paused job after relaunch', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-close-e2e-'))
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
    userData,
  })
  let { app, page } = launched
  await app.evaluate(({ dialog }) => {
    const scope = globalThis as typeof globalThis & { __haClosePrompts?: number }
    scope.__haClosePrompts = 0
    dialog.showMessageBox = (): Promise<Electron.MessageBoxReturnValue> => {
      scope.__haClosePrompts = (scope.__haClosePrompts ?? 0) + 1
      return Promise.resolve({ response: 0, checkboxChecked: false })
    }
  })
  await enqueue('https://example.test/slow')
  await expect(page.getByRole('tab', { name: /Queue/u }).getByText('1')).toBeVisible()
  await page.evaluate(() => window.api.window.close())
  await expect
    .poll(() =>
      app.evaluate(() => {
        const scope = globalThis as typeof globalThis & { __haClosePrompts?: number }
        return scope.__haClosePrompts
      }),
    )
    .toBe(1)
  expect(page.isClosed()).toBe(false)

  await app.evaluate(({ dialog }) => {
    dialog.showMessageBox = (): Promise<Electron.MessageBoxReturnValue> =>
      Promise.resolve({ response: 1, checkboxChecked: false })
  })
  const closed = page.waitForEvent('close')
  const appClosed = app.waitForEvent('close')
  await page.evaluate(() => window.api.window.close())
  await closed
  await appClosed
  launched = null

  launched = await launchElectronApp({ env: { HA_TEST_ENGINE_SCRIPT: fakeEngine }, userData })
  ;({ app, page } = launched)
  await page.getByRole('tab', { name: /Queue/u }).click()
  await expect(page.getByRole('dialog', { name: 'Resume interrupted downloads?' })).toBeVisible()
  await expect(page.locator('[data-state="paused"]')).toBeVisible()
  await page
    .getByRole('dialog', { name: 'Resume interrupted downloads?' })
    .getByRole('button', { name: 'Cancel' })
    .click()
})

test('routes a native notification click to the Queue', async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false, notifyOnComplete: true },
  })
  const { app, page } = launched
  await app.evaluate(({ Notification }) => {
    const scope = globalThis as typeof globalThis & {
      __haNotification?: { emit: (event: string) => boolean }
    }
    Notification.prototype.show = function show(): void {
      scope.__haNotification = this
    }
  })
  const browserWindow = await app.browserWindow(page)
  await browserWindow.evaluate((window) => window.hide())
  await enqueue('https://example.test/notification')
  await expect
    .poll(() =>
      app.evaluate(() => {
        const scope = globalThis as typeof globalThis & { __haNotification?: unknown }
        return Boolean(scope.__haNotification)
      }),
    )
    .toBe(true)
  await app.evaluate(() => {
    const scope = globalThis as typeof globalThis & {
      __haNotification?: { emit: (event: string) => boolean }
    }
    scope.__haNotification?.emit('click')
  })
  await expect.poll(() => browserWindow.evaluate((window) => window.isVisible())).toBe(true)
  await expect(page.getByRole('tab', { name: /Queue/u })).toHaveAttribute('aria-selected', 'true')
})

test('applies a concurrency preference change to queued work immediately', async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false, maxConcurrent: 1 },
  })
  const firstDir = join(launched.userData, 'concurrency-one')
  const secondDir = join(launched.userData, 'concurrency-two')
  await Promise.all([mkdir(firstDir), mkdir(secondDir)])
  await enqueue('https://example.test/concurrency-first', firstDir)
  await enqueue('https://example.test/concurrency-second', secondDir)
  const { page } = launched
  await page.getByRole('tab', { name: /Queue/u }).click()
  await expect(page.locator('[data-state="downloading"]')).toHaveCount(1)
  await expect(page.locator('[data-state="queued"]')).toHaveCount(1)

  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByRole('combobox', { name: 'Concurrent downloads' }).click()
  await page.getByRole('option', { name: '2' }).click()
  await page.getByRole('tab', { name: /Queue/u }).click()
  await expect(page.locator('[data-state="downloading"]')).toHaveCount(2)

  await page.evaluate(async () => {
    const snapshot = await window.api.downloads.list()
    if (!snapshot.ok) return
    await Promise.all(snapshot.value.jobs.map((job) => window.api.downloads.cancel(job.id)))
  })
  await expect(page.locator('[data-state="canceled"]')).toHaveCount(2)
})

test('handles global drag-drop, shortcuts, and second-instance focus', async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
  })
  const { app, page } = launched
  await page.getByRole('tab', { name: 'About' }).click()
  await page.evaluate(() => {
    const transfer = new DataTransfer()
    transfer.setData('text/plain', 'Try https://example.test/dropped now')
    document
      .querySelector('[data-testid="app-shell"]')
      ?.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
  })
  await expect(page.getByRole('tab', { name: 'Downloader' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByLabel('Video or audio link')).toHaveValue('https://example.test/dropped')

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  await page.keyboard.press(`${modifier}+,`)
  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('switch', { name: 'Auto-paste link from clipboard' }).click()
  await expect(page.getByText('Saved')).toBeVisible()
  await page.keyboard.press(`${modifier}+L`)
  await expect(page.getByLabel('Video or audio link')).toBeFocused()

  const browserWindow = await app.browserWindow(page)
  await app.evaluate(({ clipboard }) => clipboard.writeText('https://example.test/auto-paste'))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByLabel('Video or audio link')).toHaveValue(
    'https://example.test/auto-paste',
  )
  await browserWindow.evaluate((window) => window.minimize())
  await app.evaluate(({ app: electronApp }) => {
    electronApp.emit('second-instance', {} as Electron.Event, [], '', {})
  })
  await expect.poll(() => browserWindow.evaluate((window) => window.isMinimized())).toBe(false)
})

test('shows friendly offline and missing-folder failures without crashing', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-resilience-e2e-'))
  const downloadDir = join(userData, 'downloads')
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false, downloadDir },
    userData,
  })
  const { page } = launched
  const input = page.getByLabel('Video or audio link')
  await input.fill('https://example.test/offline')
  await expect(
    page.getByTestId('url-card').getByText('The network appears to be offline.'),
  ).toBeVisible()
  await input.fill('https://example.test/folder-check')
  await expect(page.getByTestId('media-preview')).toBeVisible()
  await rm(downloadDir, { force: true, recursive: true })
  await page.getByRole('button', { name: /^Download Now/u }).click()
  await expect(
    page.getByTestId('url-card').getByText('The selected folder is not writable.'),
  ).toBeVisible()
})

test('fails safely if the output folder disappears during a download', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-folder-loss-e2e-'))
  const downloadDir = join(userData, 'downloads')
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false, downloadDir },
    userData,
  })
  const { page } = launched
  await enqueue('https://example.test/slow-folder-loss')
  await page.getByRole('tab', { name: /Queue/u }).click()
  await expect(page.locator('[data-state="downloading"]')).toBeVisible()
  await rm(downloadDir, { force: true, recursive: true })
  await expect(page.locator('[data-state="failed"]')).toBeVisible()
  await expect(page.getByText('The download engine reported an unexpected problem.')).toBeVisible()
})

async function enqueue(url: string, outputDirOverride?: string): Promise<void> {
  if (!launched) throw new Error('Electron app is not running')
  const settings = await launched.page.evaluate(() => window.api.settings.get())
  if (!settings.ok) throw new Error(settings.error.message)
  const result = await launched.page.evaluate(
    ({ outputDir, targetUrl }) =>
      window.api.downloads.enqueue({
        url: targetUrl,
        mediaId: 'phase4-test',
        title: 'Phase 4 system integration',
        platform: 'Fake',
        durationSec: 10,
        options: {
          kind: 'video',
          quality: 1080,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: true,
        },
        outputDir,
      }),
    { outputDir: outputDirOverride ?? settings.value.downloadDir, targetUrl: url },
  )
  if (!result.ok) throw new Error(result.error.message)
}
