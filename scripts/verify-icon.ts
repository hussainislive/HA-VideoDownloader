import { open, stat } from 'node:fs/promises'
import { join } from 'node:path'

const iconPath = join(process.cwd(), 'resources', 'icon.png')
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

async function main(): Promise<void> {
  const details = await stat(iconPath)
  if (!details.isFile()) throw new Error('resources/icon.png is not a file')
  const handle = await open(iconPath, 'r')
  const header = Buffer.alloc(24)
  try {
    await handle.read(header, 0, header.length, 0)
  } finally {
    await handle.close()
  }
  if (!header.subarray(0, 8).equals(pngSignature) || header.toString('ascii', 12, 16) !== 'IHDR')
    throw new Error('resources/icon.png is not a valid PNG')
  const width = header.readUInt32BE(16)
  const height = header.readUInt32BE(20)
  if (width !== height)
    throw new Error(`resources/icon.png must be square; found ${width}×${height}`)
  if (width < 512)
    throw new Error(`resources/icon.png must be at least 512×512; found ${width}×${height}`)
  if (width < 1_024)
    process.stderr.write(
      `Warning: resources/icon.png is ${width}×${height}; 1024×1024 is recommended\n`,
    )
  process.stdout.write(`resources/icon.png: valid ${width}×${height} PNG\n`)
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Icon verification failed'}\n`)
  process.exitCode = 1
})
