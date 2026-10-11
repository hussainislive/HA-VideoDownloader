import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
let launched: LaunchedApp | null = null

function current(): LaunchedApp {
  if (!launched) throw new Error('Electron test app was not launched')
  return launched
}

async function resize(width: number, height: number): Promise<void> {
  const { app, page } = current()
  const browserWindow = await app.browserWindow(page)
  await browserWindow.evaluate((window, size) => window.setSize(...size), [width, height])
}

async function readyDownloader(): Promise<void> {
  const { app, page } = current()
  await app.evaluate(({ clipboard }) => clipboard.writeText('https://example.test/visual'))
  await page.getByRole('button', { name: 'Paste' }).click()
  await expect(page.getByTestId('media-preview')).toBeVisible()
  await page.evaluate(async () => document.fonts.ready)
}

async function enqueueJobs(count: number, path: string): Promise<void> {
  const { page, userData } = current()
  const directories = await Promise.all(
    Array.from({ length: count }, async (_, index) => {
      const directory = join(userData, `${path}-${index}`)
      await mkdir(directory, { recursive: true })
      return directory
    }),
  )
  await page.evaluate(
    async ({ dirs, urlPath }) => {
      await Promise.all(
        dirs.map((outputDir, index) =>
          window.api.downloads.enqueue({
            url: `https://example.test/${urlPath}-${index}`,
            mediaId: `fake-${index}`,
            title: `Performance sample ${index + 1}`,
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
        ),
      )
    },
    { dirs: directories, urlPath: path },
  )
}

test.beforeEach(async () => {
  launched = await launchElectronApp({
    env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
    settings: { autoPasteClipboard: false, maxConcurrent: 3 },
  })
  const status = await launched.page.evaluate(() => window.api.engine.getStatus())
  expect(status.ok).toBe(true)
  if (status.ok) expect(status.value.ok).toBe(true)
})

test.afterEach(async () => {
  await closeElectronApp(launched)
  launched = null
})

test('matches Downloader at 850×600 and 1280×800 without scrolling', async () => {
  const { page } = current()
  await readyDownloader()
  for (const [width, height, name] of [
    [850, 600, 'phase3-downloader-850.png'],
    [1280, 800, 'phase3-downloader-1280.png'],
  ] as const) {
    await resize(width, height)
    await expect
      .poll(() => page.locator('main').evaluate((main) => main.scrollHeight <= main.clientHeight))
      .toBe(true)
    await expect(page).toHaveScreenshot(name, { animations: 'disabled' })
  }
  await page.screenshot({ animations: 'disabled', path: join('docs/images/downloader.png') })
})

test('matches a real paused/queued Queue at 850×600 and 1280×800', async () => {
  const { page } = current()
  await enqueueJobs(3, 'slow-visual')
  await page.getByRole('tab', { name: /Queue/u }).click()
  await expect(page.locator('[data-state="downloading"]')).toHaveCount(3)
  await page.evaluate(async () => {
    const snapshot = await window.api.downloads.list()
    if (!snapshot.ok) return
    await Promise.all(
      snapshot.value.jobs
        .filter((job) => job.state === 'downloading')
        .map((job) => window.api.downloads.pause(job.id)),
    )
  })
  await expect(page.locator('[data-state="paused"]')).toHaveCount(3)
  for (const [width, height, name] of [
    [850, 600, 'phase3-queue-850.png'],
    [1280, 800, 'phase3-queue-1280.png'],
  ] as const) {
    await resize(width, height)
    await expect(page).toHaveScreenshot(name, { animations: 'disabled' })
  }
  await page.screenshot({ animations: 'disabled', path: join('docs/images/queue.png') })
})

test('has no serious accessibility violations on both Phase 3 screens', async () => {
  const { page } = current()
  await readyDownloader()
  for (const tab of ['Downloader', 'Queue'] as const) {
    await page.getByRole('tab', { name: new RegExp(tab, 'u') }).click()
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    expect(
      results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      ),
    ).toEqual([])
  }
})

test('keeps at least 55 animation frames per second with three active jobs', async () => {
  const { page } = current()
  await enqueueJobs(3, 'perf')
  await page.getByRole('tab', { name: /Queue/u }).click()
  await expect(page.locator('[data-state="downloading"]')).toHaveCount(3)
  const frames = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0
        const start = performance.now()
        const tick = (time: number): void => {
          count += 1
          if (time - start >= 1_000) resolve(count)
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
  expect(frames).toBeGreaterThanOrEqual(55)
})
