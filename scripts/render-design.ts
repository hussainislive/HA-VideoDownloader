import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'

async function main(): Promise<void> {
  const designRoot = join(process.cwd(), 'design')
  const outputRoot = join(designRoot, '_renders')
  const entries = await readdir(designRoot, { withFileTypes: true })
  const screens = entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('-screen'))
    .map((entry) => entry.name)
    .sort()

  await mkdir(outputRoot, { recursive: true })
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 850, height: 600 } })
    for (const screen of screens) {
      const source = join(designRoot, screen, 'code.html')
      await page.goto(pathToFileURL(source).toString(), { waitUntil: 'networkidle' })
      await page.screenshot({ path: join(outputRoot, `${screen.replace('-screen', '')}.png`) })
      process.stdout.write(`Rendered ${screen}\n`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown design render failure'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
