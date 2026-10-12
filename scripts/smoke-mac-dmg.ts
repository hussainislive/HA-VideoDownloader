import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import { _electron as electron, type ElectronApplication } from '@playwright/test'
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
