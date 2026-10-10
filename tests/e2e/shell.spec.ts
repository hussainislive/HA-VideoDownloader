/// <reference lib="dom" />

import AxeBuilder from '@axe-core/playwright'
import { type ConsoleMessage, expect, test } from '@playwright/test'

import type { HaApi } from '../../src/shared/ipc/api'
import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

declare global {
  interface Window {
    api: HaApi
  }
}

const TABS = ['Downloader', 'Queue', 'Library', 'Settings', 'About'] as const
let launched: LaunchedApp | null = null

function current(): LaunchedApp {
  if (!launched) throw new Error('Electron test app was not launched')
  return launched
}

test.beforeEach(async () => {
  launched = await launchElectronApp()
})

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('launches a secure shell and switches every tab', async () => {
  const { page } = current()
  const errors: string[] = []
  const captureError = (message: ConsoleMessage): void => {
    if (message.type() === 'error') errors.push(message.text())
  }
  page.on('console', captureError)

  await expect(page).toHaveTitle('HA Premium Video Downloader')
  await expect(page.getByText('Downloader workspace')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.platform))
    .toBe(process.platform)

  for (const tab of TABS) {
    await page.getByRole('tab', { name: tab }).click()
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
  }

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  for (const [index, tab] of TABS.entries()) {
    await page.keyboard.press(`${modifier}+${index + 1}`)
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
  }
  expect(errors).toEqual([])
})

test('enforces the minimum window size', async () => {
  const { app, page } = current()
  const browserWindowHandle = await app.browserWindow(page)
  const size = await browserWindowHandle.evaluate((browserWindow) => {
    browserWindow.setSize(600, 400)
    return browserWindow.getSize()
  })
  expect(size[0]).toBeGreaterThanOrEqual(850)
  expect(size[1]).toBeGreaterThanOrEqual(600)
})

test('stays usable at common sizes and when maximized', async () => {
  const { app, page } = current()
  const browserWindowHandle = await app.browserWindow(page)

  for (const [width, height] of [
    [1024, 700],
    [1280, 800],
  ] as const) {
    await browserWindowHandle.evaluate(
      (browserWindow, size) => browserWindow.setSize(...size),
      [width, height],
    )
    await expect(page.getByRole('tablist', { name: 'Application sections' })).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
  }

  await browserWindowHandle.evaluate((browserWindow) => browserWindow.maximize())
  await expect
    .poll(() => browserWindowHandle.evaluate((browserWindow) => browserWindow.isMaximized()))
    .toBe(true)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
})

test('handles minimize, maximize, restore, and close through narrow IPC', async () => {
  const { app, page } = current()
  const browserWindowHandle = await app.browserWindow(page)

  await page.evaluate(() => window.api.window.minimize())
  await expect
    .poll(() => browserWindowHandle.evaluate((browserWindow) => browserWindow.isMinimized()))
    .toBe(true)
  await browserWindowHandle.evaluate((browserWindow) => browserWindow.restore())

  await page.evaluate(() => window.api.window.toggleMaximize())
  await expect
    .poll(() => browserWindowHandle.evaluate((browserWindow) => browserWindow.isMaximized()))
    .toBe(true)
  await page.evaluate(() => window.api.window.toggleMaximize())
  await expect
    .poll(() => browserWindowHandle.evaluate((browserWindow) => browserWindow.isMaximized()))
    .toBe(false)

  const closed = page.waitForEvent('close')
  await page.evaluate(() => {
    void window.api.window.close()
  })
  await closed
})

test('has no serious or critical accessibility violations on any screen', async () => {
  const { page } = current()
  for (const tab of TABS) {
    await page.getByRole('tab', { name: tab }).click()
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    const severe = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(severe, `${tab} accessibility violations`).toEqual([])
  }
})

test('matches the 850 by 600 shell baseline', async () => {
  const { app, page } = current()
  const browserWindowHandle = await app.browserWindow(page)
  await browserWindowHandle.evaluate((browserWindow) => browserWindow.setSize(850, 600))
  await expect
    .poll(() => browserWindowHandle.evaluate((browserWindow) => browserWindow.getOpacity()))
    .toBe(1)
  await expect(page.getByText('Downloader workspace')).toBeVisible()
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await expect(page).toHaveScreenshot('shell-850.png', { animations: 'disabled' })
})
