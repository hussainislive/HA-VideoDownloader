import { join } from 'node:path'

import {
  BUNDLED_MAC_RUNTIME_SHA256,
  BUNDLED_MAC_RUNTIME_VERSION,
  installMacRuntimeArchive,
} from '../src/main/engine/mac-runtime-release'

async function main(): Promise<void> {
  if (process.platform !== 'darwin') return
  const parent = join(process.cwd(), '.cache', 'mac-runtime')
  const installed = await installMacRuntimeArchive(
    BUNDLED_MAC_RUNTIME_VERSION,
    parent,
    BUNDLED_MAC_RUNTIME_SHA256,
    process.env.HA_MAC_RUNTIME_ARCHIVE_PATH,
  )
  process.stdout.write(
    `Verified unpackaged macOS yt-dlp ${BUNDLED_MAC_RUNTIME_VERSION}: ${installed}\n`,
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to prepare macOS yt-dlp runtime'
  if (process.argv.includes('--optional')) {
    process.stderr.write(`Fast macOS runtime unavailable in development: ${message}\n`)
    return
  }
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
