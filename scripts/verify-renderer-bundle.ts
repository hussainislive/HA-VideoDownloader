import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 350 * 1_024
const assets = join(process.cwd(), 'out', 'renderer', 'assets')

async function main(): Promise<void> {
  const files = (await readdir(assets)).filter((name) => name.endsWith('.js'))
  if (files.length === 0)
    throw new Error('No renderer JavaScript bundles were found; run build first')
  const sizes = await Promise.all(
    files.map(async (name) => ({
      name,
      size: gzipSync(await readFile(join(assets, name))).length,
    })),
  )
  const total = sizes.reduce((sum, file) => sum + file.size, 0)
  process.stdout.write(
    `Renderer JavaScript: ${(total / 1_024).toFixed(1)} KiB gzip across ${files.length} chunks (budget ${(BUDGET_BYTES / 1_024).toFixed(0)} KiB)\n`,
  )
  if (total > BUDGET_BYTES) {
    const largest = [...sizes].sort((left, right) => right.size - left.size).slice(0, 5)
    throw new Error(
      `Renderer bundle exceeds budget. Largest chunks: ${largest.map((file) => `${file.name} ${(file.size / 1_024).toFixed(1)} KiB`).join(', ')}`,
    )
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Renderer bundle verification failed'}\n`,
  )
  process.exitCode = 1
})
