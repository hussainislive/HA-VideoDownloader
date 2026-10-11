import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { closeElectronApp, type LaunchedApp, launchElectronApp } from './electron-app'

const fakeEngine = join(process.cwd(), 'tests/fixtures/fake-engine/index.mjs')

test.describe('Phase 2 headless engine', () => {
  let launched: LaunchedApp | null = null

  test.afterEach(async () => closeElectronApp(launched))

  test('drives probe and download through the narrow preload API', async () => {
    launched = await launchElectronApp({ env: { HA_TEST_ENGINE_SCRIPT: fakeEngine } })
    const outputDir = join(launched.userData, 'downloads')
    await mkdir(outputDir)
    const result = await launched.page.evaluate(async (directory) => {
      const probe = await window.api.media.probe('https://example.test/ok')
      if (!probe.ok) return probe
      const queued = await window.api.downloads.enqueue({
        url: probe.value.webpageUrl,
        mediaId: probe.value.id,
        title: probe.value.title,
        uploader: probe.value.uploader,
        platform: probe.value.extractor,
        durationSec: probe.value.durationSec,
        options: {
          kind: 'video',
          quality: 480,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: true,
          videoFormatId: 'v480',
          audioFormatId: 'a1',
        },
        outputDir: directory,
      })
      if (!queued.ok) return queued
      for (let index = 0; index < 100; index += 1) {
        const snapshot = await window.api.downloads.list()
        if (snapshot.ok && snapshot.value.jobs[0]?.state === 'completed') return snapshot
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      throw new Error('Download did not complete')
    }, outputDir)
    expect(result.ok).toBe(true)
    if (result.ok)
      expect(result.value.jobs[0]).toMatchObject({ state: 'completed', progress: { percent: 100 } })
  })

  test('persists an interrupted job and resumes it after relaunch', async () => {
    const userData = await mkdtemp(join(tmpdir(), 'ha-recovery-e2e-'))
    const outputDir = join(userData, 'downloads')
    await mkdir(outputDir)
    launched = await launchElectronApp({ userData, env: { HA_TEST_ENGINE_SCRIPT: fakeEngine } })
    const id = await launched.page.evaluate(async (directory) => {
      const queued = await window.api.downloads.enqueue({
        url: 'https://example.test/slow',
        mediaId: 'fake-id',
        title: 'Fake Video',
        platform: 'Fake',
        options: {
          kind: 'video',
          quality: 480,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: true,
        },
        outputDir: directory,
      })
      if (!queued.ok) throw new Error(queued.error.message)
      await new Promise((resolve) => setTimeout(resolve, 650))
      return queued.value.id
    }, outputDir)
    await closeElectronApp(launched, true)
    launched = null
    launched = await launchElectronApp({ userData, env: { HA_TEST_ENGINE_SCRIPT: fakeEngine } })
    const recovered = await launched.page.evaluate(() => window.api.downloads.list())
    expect(recovered).toMatchObject({ ok: true, value: { recoveryCount: 1 } })
    const completed = await launched.page.evaluate(async (jobId) => {
      await window.api.downloads.resume(jobId)
      for (let index = 0; index < 100; index += 1) {
        const snapshot = await window.api.downloads.list()
        if (snapshot.ok && snapshot.value.jobs[0]?.state === 'completed') return true
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      return false
    }, id)
    expect(completed).toBe(true)
    await closeElectronApp(launched, true)
    launched = null
    await rm(userData, { recursive: true, force: true })
  })
})
