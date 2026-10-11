import { access, mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'
import { createHistoryFixture } from './history-fixture'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
let launched: LaunchedApp | null = null

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('searches, filters, detects missing files, and supports both Library delete choices', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-library-e2e-'))
  const fixture = await createHistoryFixture(userData, 5, new Set([3]))
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    history: fixture.items,
    settings: { autoPasteClipboard: false },
    userData,
  })
  const { page } = launched
  await page.getByRole('tab', { name: 'Library' }).click()
  await expect(page.locator('[data-library-id]')).toHaveCount(5)
  await expect(page.locator('[data-library-id][data-missing="true"]')).toHaveCount(1)
  await expect(
    page
      .locator('[data-library-id][data-missing="true"]')
      .getByRole('button', { name: 'Play media' }),
  ).toBeDisabled()

  const search = page.getByLabel('Search library')
  await search.fill('Focus Audio')
  await expect(page.locator('[data-library-id]')).toHaveCount(2)
  await search.clear()
  await page.getByRole('button', { name: /Audio \(2\)/u }).click()
  await expect(page.locator('[data-library-id]')).toHaveCount(2)
  await page.getByRole('button', { name: /All \(5\)/u }).click()

  const historyOnly = page.locator(`[data-library-id="${fixture.items[0]?.id}"]`)
  await historyOnly.getByRole('button', { name: 'Delete from history' }).click()
  let dialog = page.getByRole('dialog', { name: COPY_DELETE_TITLE })
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(historyOnly).toHaveCount(0)
  await expect(access(fixture.paths[0] ?? '')).resolves.toBeUndefined()

  const withFile = page.locator(`[data-library-id="${fixture.items[1]?.id}"]`)
  await withFile.getByRole('button', { name: 'Delete from history' }).click()
  dialog = page.getByRole('dialog', { name: COPY_DELETE_TITLE })
  await dialog.getByLabel('Also delete the file from disk').check()
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(withFile).toHaveCount(0)
  await expect(access(fixture.paths[1] ?? '')).rejects.toMatchObject({ code: 'ENOENT' })
})

test('persists Settings and window state across a real relaunch', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-settings-e2e-'))
  const fixture = await createHistoryFixture(userData, 1)
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    history: fixture.items,
    settings: { autoPasteClipboard: false },
    userData,
  })
  let { app, page } = launched
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByRole('switch', { name: 'Keep window on top' }).click()
  await page.getByRole('combobox', { name: 'Default quality' }).click()
  await page.getByRole('option', { name: 'HD (720p)' }).click()
  await page.getByRole('combobox', { name: 'Concurrent downloads' }).click()
  await page.getByRole('option', { name: '4' }).click()
  await expect(page.getByText('Saved')).toBeVisible()
  const browserWindow = await app.browserWindow(page)
  await browserWindow.evaluate((window) => window.setSize(1_024, 700))
  await expect.poll(() => browserWindow.evaluate((window) => window.isAlwaysOnTop())).toBe(true)

  await closeElectronApp(launched, true)
  launched = null
  launched = await launchElectronApp({ env: { HA_TEST_ENGINE_SCRIPT: fakeEngine }, userData })
  ;({ app, page } = launched)
  await page.getByRole('tab', { name: 'Settings' }).click()
  await expect(page.getByRole('switch', { name: 'Keep window on top' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(page.getByRole('combobox', { name: 'Default quality' })).toContainText('HD (720p)')
  await expect(page.getByRole('combobox', { name: 'Concurrent downloads' })).toContainText('4')
  const relaunchedWindow = await app.browserWindow(page)
  await expect
    .poll(() => relaunchedWindow.evaluate((window) => window.getSize()))
    .toEqual([1_024, 700])
  await page.getByRole('tab', { name: 'Library' }).click()
  await expect(page.getByText(fixture.items[0]?.title ?? '')).toBeVisible()
})

test('shows real engine update feedback and applies defaults to Downloader', async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
  })
  const { page } = launched
  await page.getByRole('tab', { name: 'Settings' }).click()
  await expect(page.getByText('2099.01.01-fake')).toBeVisible()
  await page.getByRole('combobox', { name: 'Default quality' }).click()
  await page.getByRole('option', { name: 'HD (720p)' }).click()
  await page.getByRole('combobox', { name: 'Default container' }).click()
  await page.getByRole('option', { name: 'MKV' }).click()
  await page.getByRole('button', { name: /Check & Update Engine/u }).click()
  await expect(page.getByText('yt-dlp is up to date')).toBeVisible()
  await page.getByRole('tab', { name: 'Downloader' }).click()
  await expect(page.getByRole('combobox', { name: 'Quality' })).toContainText('HD (720p)')
  await expect(page.getByRole('combobox', { name: 'Container' })).toContainText('MKV')
})

test('uses the local About profile and only opens allowlisted external links', async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
  })
  const { app, page } = launched
  await app.evaluate(({ shell }) => {
    const scope = globalThis as typeof globalThis & { __haOpenedUrls?: string[] }
    scope.__haOpenedUrls = []
    shell.openExternal = (url): Promise<void> => {
      scope.__haOpenedUrls?.push(url)
      return Promise.resolve()
    }
  })
  await page.getByRole('tab', { name: 'About' }).click()
  await expect(page.getByAltText('Hussain Ahmed')).toBeVisible()
  await page.getByRole('button', { name: /developer\.hussain125@gmail\.com/u }).click()
  await expect(page.getByText('Email copied')).toBeVisible()
  await expect
    .poll(() => app.evaluate(({ clipboard }) => clipboard.readText()))
    .toBe('developer.hussain125@gmail.com')
  await page.getByRole('button', { name: 'View on GitHub' }).click()
  await page.getByRole('button', { name: 'LinkedIn' }).first().click()
  await expect
    .poll(() =>
      app.evaluate(() => {
        const scope = globalThis as typeof globalThis & { __haOpenedUrls?: string[] }
        return scope.__haOpenedUrls
      }),
    )
    .toEqual([
      'https://github.com/hussainislive/HA-VideoDownloader',
      'https://www.linkedin.com/in/hussainislive/',
    ])
  const rejected = await page.evaluate(() => window.api.system.openExternal('https://example.com'))
  expect(rejected).toMatchObject({ ok: false, error: { code: 'EXTERNAL_URL_BLOCKED' } })
})

test('recovers corrupt history and virtualizes 500 Unicode-safe rows', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-large-library-e2e-'))
  await writeFile(join(userData, 'history.json'), '{broken')
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
    userData,
  })
  await expect(launched.page.getByText(/Damaged library history/u)).toBeVisible()
  expect((await readdir(userData)).some((name) => name.startsWith('history.json.corrupt-'))).toBe(
    true,
  )
  await closeElectronApp(launched, true)
  launched = null

  const fixture = await createHistoryFixture(userData, 500)
  await writeFile(
    join(userData, 'history.json'),
    JSON.stringify({ schemaVersion: 1, items: fixture.items }),
  )
  launched = await launchElectronApp({ env: { HA_TEST_ENGINE_SCRIPT: fakeEngine }, userData })
  const { page } = launched
  await page.getByRole('tab', { name: 'Library' }).click()
  await expect(page.getByText('500 items · 637 KB')).toBeVisible()
  const renderedRows = await page.locator('[data-library-id]').count()
  expect(renderedRows).toBeGreaterThan(0)
  expect(renderedRows).toBeLessThan(25)
  const frames = await page.getByTestId('library-list').evaluate(
    (element) =>
      new Promise<number>((resolve) => {
        let count = 0
        const start = performance.now()
        const tick = (time: number): void => {
          count += 1
          const elapsed = time - start
          element.scrollTop = (element.scrollHeight - element.clientHeight) * (elapsed / 1_000)
          if (elapsed >= 1_000) resolve(count)
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
  expect(frames).toBeGreaterThanOrEqual(55)
  await page.getByTestId('library-list').evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(page.getByText(fixture.items.at(-1)?.title ?? '')).toBeVisible()
})

const COPY_DELETE_TITLE = 'Delete from history?'
