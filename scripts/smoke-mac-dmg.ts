import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { z } from 'zod'

const productName = 'HA Premium Video Downloader'

function run(file: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, [...args], {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')))
    child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')))
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`${file} failed with code ${String(code)}: ${output.trim()}`))
    })
  })
}

function mountPoint(plist: string): string {
  const match = plist.match(/<key>mount-point<\/key>\s*<string>([^<]+)<\/string>/u)
  if (!match?.[1]) throw new Error('hdiutil did not report a mounted volume')
  return match[1]
}

async function verifyLiveFacebook(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Downloader' }).click()
  await page
    .getByLabel('Video or audio link')
    .fill('https://www.facebook.com/reel/4849851438576607')
  await page.getByTestId('media-preview').waitFor({ state: 'visible', timeout: 90_000 })
  await page.getByRole('button', { name: /^Download Now/u }).click()
  await page.getByRole('tab', { name: /Queue/u }).click()
  await page.locator('[data-state="completed"]').waitFor({ state: 'visible', timeout: 120_000 })
  const snapshot = await page.evaluate(() => window.api.downloads.list())
  if (!snapshot.ok || !snapshot.value.jobs[0]?.filePath)
    throw new Error('The packaged app did not report a saved file')
  if ((await stat(snapshot.value.jobs[0].filePath)).size === 0)
    throw new Error('The packaged app saved an empty file')
  process.stdout.write('Packaged Facebook reel: preview and non-empty download verified\n')
}

async function main(): Promise<void> {
  if (process.platform !== 'darwin') throw new Error('The DMG smoke test requires macOS')
  const architecture = process.argv[2]
  if (architecture !== 'x64')
    throw new Error('The Intel host can execute only: smoke-mac-dmg.ts x64')
  const packageData: unknown = JSON.parse(
    await readFile(join(process.cwd(), 'package.json'), 'utf8'),
  )
  const { version } = z.object({ version: z.string().min(1) }).parse(packageData)
  const dmg = join(
    process.cwd(),
    'release',
    `HA-Premium-Video-Downloader-${version}-mac-${architecture}.dmg`,
  )
  const userData = await mkdtemp(join(tmpdir(), 'ha-packaged-smoke-'))
  const downloadDir = join(userData, 'downloads')
  await mkdir(downloadDir)
  await writeFile(
    join(userData, 'settings.json'),
    JSON.stringify({
      schemaVersion: 2,
      downloadDir,
      defaultKind: 'video',
      defaultQuality: 1080,
      defaultContainer: 'mp4',
      defaultAudioFormat: 'mp3',
      defaultAudioBitrate: 320,
      maxConcurrent: 2,
      autoPasteClipboard: false,
      notifyOnComplete: false,
      embedMetadata: false,
      keepWindowOnTop: false,
    }),
  )
  const mount = mountPoint(
    await run('hdiutil', ['attach', '-plist', '-nobrowse', '-readonly', dmg]),
  )
  let app: ElectronApplication | undefined
  try {
    const executable = join(mount, `${productName}.app`, 'Contents', 'MacOS', productName)
    const environment = Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
    delete environment.ELECTRON_RUN_AS_NODE
    app = await electron.launch({
      executablePath: executable,
      args: [`--user-data-dir=${userData}`],
      env: environment,
    })
    const page = await app.firstWindow()
    try {
      const engineStatus = page.getByRole('button', { name: /Engine (Ready|problem)/u })
      await engineStatus.waitFor({ state: 'visible', timeout: 120_000 })
      if ((await engineStatus.innerText()) !== 'Engine Ready')
        throw new Error('Packaged engine reported a problem')
    } catch (error: unknown) {
      const problemButton = page.getByRole('button', { name: 'Engine problem' })
      if (await problemButton.isVisible()) {
        await problemButton.click()
        await page.waitForTimeout(500)
      }
      const visibleText = await page
        .locator('body')
        .innerText()
        .catch(() => 'window unavailable')
      throw new Error(
        `Packaged engine did not become ready. Visible app text:\n${visibleText}`,
        error instanceof Error ? { cause: error } : undefined,
      )
    }
    await page.getByRole('tab', { name: 'About' }).click()
    await page.getByText(`v${version}`, { exact: false }).waitFor({ state: 'visible' })
    process.stdout.write(`${basename(dmg)}: mounted, launched, engine ready, version verified\n`)
    if (process.argv.includes('--live-facebook')) await verifyLiveFacebook(page)
  } finally {
    await app?.close().catch(() => undefined)
    await run('hdiutil', ['detach', mount])
    await rm(userData, { force: true, recursive: true })
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'DMG smoke test failed'}\n`)
  process.exitCode = 1
})
