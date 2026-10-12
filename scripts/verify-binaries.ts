import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { constants } from 'node:fs'
import { access, open, stat } from 'node:fs/promises'
import { join } from 'node:path'

interface CommandResult {
  code: number | null
  output: string
}

interface FfmpegMetadata {
  configure: string
  version: string
}

type MacArchitecture = 'arm64' | 'x64'

const projectRoot = process.cwd()
const macArchitectures: readonly MacArchitecture[] = ['x64', 'arm64']

function run(file: string, args: readonly string[], timeoutMs = 10_000): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, [...args], {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`${file} did not respond within ${timeoutMs}ms`))
    }, timeoutMs)
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8')
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8')
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
  })
}

async function assertBinary(path: string, executable: boolean): Promise<void> {
  const details = await stat(path)
  if (!details.isFile() || details.size < 1_024)
    throw new Error(`${path} is missing or a placeholder`)
  await access(path, executable ? constants.R_OK | constants.X_OK : constants.R_OK)
  if (executable && (details.mode & 0o111) === 0) throw new Error(`${path} is not executable`)
}

function firstLineContaining(output: string, fragment: string): string | undefined {
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().includes(fragment.toLowerCase()))
}

function ffmpegMetadata(output: string): FfmpegMetadata {
  const versionLine = firstLineContaining(output, 'ffmpeg version')
  const configureLine =
    firstLineContaining(output, 'configuration: --') ?? firstLineContaining(output, '--enable-gpl')
  const version = versionLine?.match(/ffmpeg version\s+([^\s]+)/iu)?.[1]
  if (!version || !configureLine)
    throw new Error('Unable to read the FFmpeg version and configure flags')
  return {
    version,
    configure: configureLine.replace(/^configuration:\s*/iu, ''),
  }
}

async function inspectMacDependencies(path: string): Promise<void> {
  const result = await run('otool', ['-L', path])
  if (result.code !== 0) throw new Error(`otool failed for ${path}: ${result.output.trim()}`)
  const dependencies = result.output
    .split(/\r?\n/u)
    .slice(1)
    .map((line) => line.trim().split(/\s+\(/u)[0])
    .filter((dependency): dependency is string => Boolean(dependency))
  const unsafe = dependencies.filter(
    (dependency) => !dependency.startsWith('/usr/lib/') && !dependency.startsWith('/System/'),
  )
  if (unsafe.length > 0)
    throw new Error(`${path} has non-system dynamic dependencies: ${unsafe.join(', ')}`)
}

async function inspectMacBinary(path: string, expected: MacArchitecture): Promise<string> {
  await assertBinary(path, true)
  const architecture = await run('lipo', ['-info', path])
  if (architecture.code !== 0)
    throw new Error(`Unable to inspect ${path} architecture: ${architecture.output.trim()}`)
  const required = expected === 'x64' ? 'x86_64' : 'arm64'
  if (!architecture.output.includes(required))
    throw new Error(`${path} does not contain the required ${required} architecture`)
  if (path.endsWith('ffmpeg')) {
    const forbidden = expected === 'x64' ? 'arm64' : 'x86_64'
    if (architecture.output.includes(forbidden))
      throw new Error(`${path} unexpectedly contains the ${forbidden} architecture`)
  }
  const signature = await run('codesign', ['-dv', path])
  if (signature.code !== 0)
    throw new Error(`${path} has no valid code signature: ${signature.output.trim()}`)
  await inspectMacDependencies(path)
  return `${architecture.output.trim()} · signed`
}

async function inspectMacFolder(architecture: MacArchitecture): Promise<{
  lines: string[]
  metadata: FfmpegMetadata
  ytdlpHash: string
}> {
  const folder = join(projectRoot, 'binaries', `macos-${architecture}`)
  const ffmpeg = join(folder, 'ffmpeg')
  const ytdlp = join(folder, 'yt-dlp')
  const [ffmpegDetails, ytdlpDetails] = await Promise.all([
    inspectMacBinary(ffmpeg, architecture),
    inspectMacBinary(ytdlp, architecture),
  ])
  const canExecute = process.platform === 'darwin' && process.arch === architecture
  let ffmpegOutput: string
  let ytdlpVersion: string
  if (canExecute) {
    const [ffmpegVersion, ytdlpResult] = await Promise.all([
      run(ffmpeg, ['-version'], 45_000),
      run(ytdlp, ['--version'], 45_000),
    ])
    if (ffmpegVersion.code !== 0)
      throw new Error(`FFmpeg version probe failed: ${ffmpegVersion.output.trim()}`)
    if (ytdlpResult.code !== 0)
      throw new Error(`yt-dlp version probe failed: ${ytdlpResult.output.trim()}`)
    ffmpegOutput = ffmpegVersion.output
    ytdlpVersion = ytdlpResult.output.split(/\r?\n/u)[0] ?? 'unknown'
  } else {
    const staticStrings = await run('strings', ['-a', ffmpeg], 45_000)
    if (staticStrings.code !== 0)
      throw new Error(`Static FFmpeg inspection failed: ${staticStrings.output.trim()}`)
    ffmpegOutput = staticStrings.output
    ytdlpVersion = 'static check only — cannot execute on this host'
  }
  const metadata = ffmpegMetadata(ffmpegOutput)
  return {
    metadata,
    ytdlpHash: await sha256(ytdlp),
    lines: [
      `macos-${architecture}/ffmpeg: ${ffmpegDetails}`,
      `macos-${architecture}/ffmpeg version: ${metadata.version}`,
      `macos-${architecture}/ffmpeg configure: ${metadata.configure}`,
      `macos-${architecture}/yt-dlp: ${ytdlpDetails} · ${ytdlpVersion}`,
      ...(!canExecute
        ? [`macos-${architecture}: static check only — cannot execute on this host`]
        : []),
    ],
  }
}

async function assertPeX64(path: string): Promise<void> {
  await assertBinary(path, false)
  const handle = await open(path, 'r')
  try {
    const header = Buffer.alloc(512)
    await handle.read(header, 0, header.length, 0)
    if (header.toString('ascii', 0, 2) !== 'MZ') throw new Error(`${path} has no DOS header`)
    const peOffset = header.readUInt32LE(0x3c)
    const peHeader = Buffer.alloc(6)
    await handle.read(peHeader, 0, peHeader.length, peOffset)
    if (peHeader.toString('ascii', 0, 4) !== 'PE\0\0' || peHeader.readUInt16LE(4) !== 0x8664)
      throw new Error(`${path} is not a PE32+ x86-64 executable`)
  } finally {
    await handle.close()
  }
}

async function inspectWindowsBinaries(): Promise<string[]> {
  const folder = join(projectRoot, 'binaries', 'win')
  const paths = [join(folder, 'yt-dlp.exe'), join(folder, 'ffmpeg.exe')]
  await Promise.all(paths.map(assertPeX64))
  if (process.platform !== 'win32')
    return paths.map(
      (path) =>
        `${path.slice(projectRoot.length + 1)}: PE32+ x86-64 · static check only — cannot execute on this host`,
    )
  const versions = await Promise.all(
    paths.map((path) =>
      run(path, [path.endsWith('ffmpeg.exe') ? '-version' : '--version'], 45_000),
    ),
  )
  versions.forEach((result, index) => {
    if (result.code !== 0) throw new Error(`${paths[index]} version probe failed`)
  })
  return paths.map(
    (path, index) =>
      `${path.slice(projectRoot.length + 1)}: PE32+ x86-64 · ${versions[index]?.output.split(/\r?\n/u)[0] ?? 'unknown'}`,
  )
}

function sha256(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.once('error', reject)
    stream.once('end', () => resolve(hash.digest('hex')))
  })
}

async function main(): Promise<void> {
  if (process.platform !== 'darwin')
    process.stdout.write('macOS binaries: skipped — lipo, codesign, and otool require macOS\n')
  const macResults =
    process.platform === 'darwin'
      ? await Promise.all(macArchitectures.map((architecture) => inspectMacFolder(architecture)))
      : []
  const [x64, arm64] = macResults
  if (x64 && arm64) {
    if (x64.metadata.version !== arm64.metadata.version)
      throw new Error(
        `FFmpeg version mismatch: x64 ${x64.metadata.version}, arm64 ${arm64.metadata.version}`,
      )
    if (x64.ytdlpHash !== arm64.ytdlpHash)
      throw new Error('The two macOS folders do not contain the same universal yt-dlp binary')
  }
  const windows = await inspectWindowsBinaries()
  process.stdout.write(`${[...macResults.flatMap(({ lines }) => lines), ...windows].join('\n')}\n`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown binary verification failure'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
