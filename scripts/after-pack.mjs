import { spawn } from 'node:child_process'
import { chmod, stat } from 'node:fs/promises'
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
  const resources = join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    'Contents',
    'Resources',
    'binaries',
    'macos',
  )
  for (const name of ['yt-dlp', 'ffmpeg']) {
    const binary = join(resources, name)
    await stat(binary)
    await chmod(binary, 0o755)
    await run('codesign', ['--force', '--sign', '-', binary])
  }
}
