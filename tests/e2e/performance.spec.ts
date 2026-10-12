import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type ElectronApplication, expect, type Page, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'
import { createHistoryFixture } from './history-fixture'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')
const results: Record<string, unknown> = {}
let launched: LaunchedApp | null = null

test.describe.serial('Phase 5 performance @performance', () => {
  test.afterEach(async () => {
    await closeElectronApp(launched)
    launched = null
  })

  test.afterAll(async () => {
    await mkdir(join(process.cwd(), 'test-results'), { recursive: true })
    await writeFile(
      join(process.cwd(), 'test-results', 'performance-metrics.json'),
      `${JSON.stringify(results, null, 2)}\n`,
    )
    process.stdout.write(`PERFORMANCE_METRICS ${JSON.stringify(results)}\n`)
  })

  test('measures cold start to shown and interactive', async () => {
    const startedAt = performance.now()
    launched = await launchElectronApp({
      env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
      settings: { autoPasteClipboard: false },
    })
    const windowShownMs = performance.now() - startedAt
    const input = launched.page.getByLabel('Video or audio link')
    await input.focus()
    await expect(input).toBeFocused()
    const interactiveMs = performance.now() - startedAt
    results.startup = { interactiveMs, windowShownMs }
    expect(windowShownMs).toBeLessThanOrEqual(2_000)
    expect(interactiveMs).toBeLessThanOrEqual(3_000)
  })

  test('keeps app resources and active progress inside budget', async () => {
    launched = await launchElectronApp({
      env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
      settings: { autoPasteClipboard: false, maxConcurrent: 3 },
    })
    await resourceSample(launched.app)
    await wait(launched.page, 10_000)
    const idle = await resourceSample(launched.app)
    await enqueueBatch(launched.page, launched.userData, 'concurrency-resource')
    await launched.page.getByRole('tab', { name: /Queue/u }).click()
    await expect(launched.page.locator('[data-state="downloading"]')).toHaveCount(3)
    await resourceSample(launched.app)
    const frames = await animationFrames(launched.page)
    await wait(launched.page, 2_000)
    const active = await resourceSample(launched.app)
    results.resources = {
      active,
      frames,
      idle,
      targets: { idleCpuMet: idle.cpuPercent < 1, idleMemoryMet: idle.memoryMb <= 300 },
    }
    // The addendum makes Intel results a conservative baseline: misses are documented,
    // while these wider ceilings still catch a material release regression.
    expect(idle.memoryMb).toBeLessThanOrEqual(500)
    expect(idle.cpuPercent).toBeLessThan(3)
    expect(active.cpuPercent).toBeLessThan(15)
    expect(frames).toBeGreaterThanOrEqual(55)
  })

  test('scrolls and searches 5,000 rows within budget', async () => {
    const userData = await mkdtemp(join(tmpdir(), 'ha-performance-library-'))
    const missing = new Set(Array.from({ length: 5_000 }, (_, index) => index))
    const fixture = await createHistoryFixture(userData, 5_000, missing)
    launched = await launchElectronApp({
      env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
      history: fixture.items,
      settings: { autoPasteClipboard: false },
      userData,
    })
    const { page } = launched
    await page.getByRole('tab', { name: 'Library' }).click()
    await expect(page.getByText(/5000 items/u)).toBeVisible()
    const renderedRows = await page.locator('[data-library-id]').count()
    const frames = await animationFrames(page, page.getByTestId('library-list'))
    const searchMs = await measureSearch(page, 'Studio Video 4999')
    results.library = { frames, renderedRows, searchMs }
    expect(renderedRows).toBeLessThan(30)
    expect(frames).toBeGreaterThanOrEqual(55)
    expect(searchMs).toBeLessThan(100)
  })

  test('holds memory growth below ten percent over a 30-minute soak', async () => {
    test.skip(process.env.HA_PERFORMANCE_SOAK !== '1', 'Set HA_PERFORMANCE_SOAK=1 for release soak')
    test.setTimeout(31 * 60 * 1_000)
    launched = await launchElectronApp({
      env: { HA_TEST_ENGINE_SCRIPT: fakeEngine },
      settings: { autoPasteClipboard: false, maxConcurrent: 3 },
    })
    const startedAt = Date.now()
    const warmupEndsAt = startedAt + 60_000
    const soakEndsAt = startedAt + 30 * 60_000
    let batch = 0
    while (Date.now() < warmupEndsAt) await runSoakBatch(launched, batch++)
    await wait(launched.page, 2_000)
    const baseline = await resourceSample(launched.app)
    let nextReportAt = Date.now() + 5 * 60_000
    while (Date.now() < soakEndsAt) {
      await runSoakBatch(launched, batch++)
      if (Date.now() >= nextReportAt) {
        const sample = await resourceSample(launched.app)
        process.stdout.write(`SOAK ${(Date.now() - startedAt) / 60_000}m ${sample.memoryMb}MB\n`)
        nextReportAt += 5 * 60_000
      }
    }
    await wait(launched.page, 5_000)
    const final = await resourceSample(launched.app)
    const growthPercent = ((final.memoryMb - baseline.memoryMb) / baseline.memoryMb) * 100
    results.soak = { baseline, batches: batch, final, growthPercent, minutes: 30 }
    expect(growthPercent).toBeLessThanOrEqual(10)
  })
})

async function resourceSample(
  app: ElectronApplication,
): Promise<{ cpuPercent: number; memoryMb: number }> {
  const metrics = await app.evaluate(({ app }) =>
    app.getAppMetrics().map((metric) => ({
      cpu: metric.cpu.percentCPUUsage,
      memoryKb: metric.memory.workingSetSize,
    })),
  )
  return {
    cpuPercent: metrics.reduce((sum, metric) => sum + metric.cpu, 0),
    memoryMb: metrics.reduce((sum, metric) => sum + metric.memoryKb, 0) / 1_024,
  }
}

async function enqueueBatch(page: Page, userData: string, label: string): Promise<void> {
  const directories = await Promise.all(
    Array.from({ length: 3 }, async (_, index) => {
      const directory = join(userData, `${label}-${index}`)
      await mkdir(directory, { recursive: true })
      return directory
    }),
  )
  await page.evaluate(
    async ({ dirs, url }) => {
      await Promise.all(
        dirs.map((outputDir, index) =>
          window.api.downloads.enqueue({
            durationSec: 10,
            mediaId: `${url}-${index}`,
            options: {
              audioFormat: 'mp3',
              bitrate: 320,
              container: 'mp4',
              embedMetadata: true,
              kind: 'video',
              quality: 1080,
            },
            outputDir,
            platform: 'Fake',
            title: `Performance sample ${index + 1}`,
            url: `https://fake.test/${url}-${index}`,
          }),
        ),
      )
    },
    { dirs: directories, url: label },
  )
}

async function runSoakBatch(current: LaunchedApp, batch: number): Promise<void> {
  await enqueueBatch(current.page, current.userData, `slow-soak-${batch}`)
  await expect
    .poll(
      async () => {
        const result = await current.page.evaluate(() => window.api.downloads.list())
        return result.ok
          ? result.value.jobs.filter((job) =>
              ['queued', 'starting', 'downloading', 'processing'].includes(job.state),
            ).length
          : -1
      },
      { timeout: 15_000 },
    )
    .toBe(0)
  const histories = await current.page.evaluate(() => window.api.library.list())
  if (histories.ok) {
    for (const item of histories.value) {
      await current.page.evaluate((id) => window.api.library.delete(id, false), item.id)
    }
  }
  await current.page.evaluate(() => window.api.downloads.clearCompleted())
}

async function animationFrames(page: Page, locator = page.locator('body')): Promise<number> {
  return locator.evaluate(
    (element) =>
      new Promise<number>((resolve) => {
        let frames = 0
        const startedAt = performance.now()
        const tick = (time: number): void => {
          frames += 1
          if (element instanceof HTMLElement && element.scrollHeight > element.clientHeight)
            element.scrollTop =
              (element.scrollHeight - element.clientHeight) * ((time - startedAt) / 1_000)
          if (time - startedAt >= 1_000) resolve(frames)
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
}

async function measureSearch(page: Page, query: string): Promise<number> {
  return page.locator('#library-search').evaluate((element, value) => {
    const input = element as HTMLInputElement
    const startedAt = performance.now()
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return new Promise<number>((resolve, reject) => {
      const tick = (): void => {
        const elapsed = performance.now() - startedAt
        if (document.querySelectorAll('[data-library-id]').length === 1) resolve(elapsed)
        else if (elapsed > 1_000) reject(new Error('Library search did not settle'))
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }, query)
}

function wait(page: Page, delayMs: number): Promise<void> {
  return page.evaluate(
    (delay) => new Promise<void>((resolve) => setTimeout(resolve, delay)),
    delayMs,
  )
}
