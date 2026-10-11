import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'
import { createHistoryFixture } from './history-fixture'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
let launched: LaunchedApp | null = null

test.beforeEach(async () => {
  const userData = await mkdtemp(join(tmpdir(), 'ha-phase4-visual-'))
  const fixture = await createHistoryFixture(userData, 8, new Set([6]))
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    history: fixture.items,
    settings: { autoPasteClipboard: false },
    userData,
  })
  await launched.page.evaluate(async () => document.fonts.ready)
})

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('matches Library at all required sizes', async () => {
  const { page } = current()
  await page.getByRole('tab', { name: 'Library' }).click()
  await expect(page.locator('[data-library-id]')).toHaveCount(8)
  await captureAtSizes('library')
  await page.screenshot({ animations: 'disabled', path: join('docs/images/library.png') })
})

test('matches Settings at all required sizes', async () => {
  const { page } = current()
  await page.getByRole('tab', { name: 'Settings' }).click()
  await expect(page.getByText('2099.01.01-fake')).toBeVisible()
  await captureAtSizes('settings')
  await page.screenshot({ animations: 'disabled', path: join('docs/images/settings.png') })
})

test('matches About at all required sizes', async () => {
  const { page } = current()
  await page.getByRole('tab', { name: 'About' }).click()
  await expect(page.getByAltText('Hussain Ahmed')).toBeVisible()
  await captureAtSizes('about')
  await page.screenshot({ animations: 'disabled', path: join('docs/images/about.png') })
})

test('has no serious or critical accessibility violations in populated Phase 4 screens', async () => {
  const { page } = current()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const tab of ['Library', 'Settings', 'About'] as const) {
    await page.getByRole('tab', { name: tab }).click()
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    expect(
      results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      ),
      `${tab} accessibility violations`,
    ).toEqual([])
  }
})

async function captureAtSizes(screen: string): Promise<void> {
  const { app, page } = current()
  const browserWindow = await app.browserWindow(page)
  for (const [width, height] of [
    [850, 600],
    [1_280, 800],
    [1_920, 1_080],
  ] as const) {
    await browserWindow.evaluate((window, size) => window.setSize(...size), [width, height])
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
    await expect
      .poll(() => page.locator('main').evaluate((main) => main.scrollWidth <= main.clientWidth))
      .toBe(true)
    await expect(page).toHaveScreenshot(`phase4-${screen}-${width}.png`, {
      animations: 'disabled',
    })
  }
  await browserWindow.evaluate((window) => window.setSize(1_280, 800))
}

function current(): LaunchedApp {
  if (!launched) throw new Error('Electron app is not running')
  return launched
}
