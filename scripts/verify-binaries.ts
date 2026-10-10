import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { join } from 'node:path'

interface CommandResult {
  code: number | null
  output: string
}

function run(file: string, args: readonly string[], timeoutMs = 10_000): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8')
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8')
    })
    child.once('error', reject)
    child.once('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`${file} did not respond within ${timeoutMs}ms`))
    }, timeoutMs)
  })
}

async function assertBinary(path: string, executable: boolean): Promise<void> {
  const details = await stat(path)
  if (!details.isFile() || details.size < 1_024)
    throw new Error(`${path} is missing or a placeholder`)
  await access(path, executable ? constants.R_OK | constants.X_OK : constants.R_OK)
}

async function verifyMacBinary(name: 'ffmpeg' | 'yt-dlp'): Promise<string> {
  const path = join(process.cwd(), 'binaries', 'macos', name)
  await assertBinary(path, true)
  const architecture = await run('lipo', ['-info', path])
  if (architecture.code !== 0) throw new Error(`Unable to inspect ${name} architecture`)
  const version = await run(path, [name === 'ffmpeg' ? '-version' : '--version'], 45_000)
  if (version.code !== 0) throw new Error(`${name} version probe failed: ${version.output.trim()}`)
  if (architecture.output.includes('arm64')) {
    const signature = await run('codesign', ['-dv', path])
    if (signature.code !== 0) throw new Error(`${name} includes arm64 but has no code signature`)
  }
  return `${name}: ${architecture.output.trim()} · ${version.output.split('\n')[0] ?? 'unknown'}`
}

async function verifyWindowsBinary(name: 'ffmpeg.exe' | 'yt-dlp.exe'): Promise<string> {
  const path = join(process.cwd(), 'binaries', 'win', name)
  await assertBinary(path, false)
  const kind = await run('file', [path])
  if (kind.code !== 0 || !kind.output.includes('PE32+')) {
    throw new Error(`${name} is not a valid x64 Windows executable`)
  }
  return `${name}: PE32+ x86-64`
}

async function main(): Promise<void> {
  const checks = await Promise.all([
    verifyMacBinary('yt-dlp'),
    verifyMacBinary('ffmpeg'),
    verifyWindowsBinary('yt-dlp.exe'),
    verifyWindowsBinary('ffmpeg.exe'),
  ])
  process.stdout.write(`${checks.join('\n')}\n`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown binary verification failure'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
