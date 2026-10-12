import { spawn } from 'node:child_process'
import { chmod, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

function run(file, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      shell: false,
      windowsHide: true,
      stdio: 'ignore',
    })
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${file} exited with code ${String(code)}`))
    })
  })
}

export default async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return
  const binaryRoot = join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    'Contents',
    'Resources',
    'binaries',
  )
  const folders = (await readdir(binaryRoot)).filter((name) => /^macos-(?:x64|arm64)$/u.test(name))
  if (folders.length !== 1)
    throw new Error(
      `Expected one architecture-specific macOS binary folder, found ${folders.length}`,
    )
  const resources = join(binaryRoot, folders[0])
  for (const name of ['yt-dlp', 'ffmpeg']) {
    const binary = join(resources, name)
    await stat(binary)
    await chmod(binary, 0o755)
    await run('codesign', ['--force', '--sign', '-', binary])
  }
}
