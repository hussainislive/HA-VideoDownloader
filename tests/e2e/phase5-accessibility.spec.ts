import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
const tabs = ['Downloader', 'Queue', 'Library', 'Settings', 'About'] as const
let launched: LaunchedApp | null = null

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('supports keyboard-only navigation, reduced motion, and 200% zoom', async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false },
  })
  const { app, page } = launched
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

  await page.keyboard.press(`${modifier}+L`)
  const input = page.getByLabel('Video or audio link')
  await expect(input).toBeFocused()
  await input.fill('https://fake.test/keyboard')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('media-preview')).toBeVisible()

  const browserWindow = await app.browserWindow(page)
  await browserWindow.evaluate((window) => {
    window.setSize(1_920, 1_080)
    window.webContents.setZoomFactor(2)
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))
    .toBe(true)

  for (const [index, tab] of tabs.entries()) {
    await page.keyboard.press(`${modifier}+${index + 1}`)
    await expect(page.getByRole('tab', { name: new RegExp(tab, 'u') })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect
      .poll(() =>
        page.evaluate(() => {
          const main = document.querySelector('main')
          return (
            main !== null &&
            document.documentElement.scrollWidth <= document.documentElement.clientWidth &&
            main.scrollWidth <= main.clientWidth
          )
        }),
      )
      .toBe(true)
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    expect(
      results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      ),
      `${tab} accessibility violations at 200% zoom`,
    ).toEqual([])
  }

  const transitionSeconds = await page
    .getByRole('tab', { name: 'About' })
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))
  expect(transitionSeconds).toBeLessThanOrEqual(0.001)
})
