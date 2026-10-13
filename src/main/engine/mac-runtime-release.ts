import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ProcessRunner } from './process-runner'

export const BUNDLED_MAC_RUNTIME_VERSION = '2026.08.19'
export const BUNDLED_MAC_RUNTIME_SHA256 =
  '07e54b0865303c864006925913bce2604f8ee8cc6f18699bac9c309f9328a6d8'

const RELEASE_ROOT = 'https://github.com/yt-dlp/yt-dlp/releases/download'
const VERSION_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/u

export function macRuntimeArchiveUrl(version: string): string {
  if (!VERSION_PATTERN.test(version)) throw new Error('Invalid yt-dlp release version')
  return `${RELEASE_ROOT}/${version}/yt-dlp_macos.zip`
}

async function releaseResponse(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'HA-VideoDownloader' },
    signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) throw new Error(`Official yt-dlp release returned HTTP ${response.status}`)
  return response
}

export async function latestMacRuntimeVersion(): Promise<string> {
  const response = await releaseResponse(
    'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest',
  )
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object' || !('tag_name' in value))
    throw new Error('Official yt-dlp release metadata is invalid')
  const version = value.tag_name
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version))
    throw new Error('Official yt-dlp release version is invalid')
  return version
}

async function officialChecksum(version: string): Promise<string> {
  const response = await releaseResponse(`${RELEASE_ROOT}/${version}/SHA2-256SUMS`)
  const sums = await response.text()
  const match = sums.match(/^([a-f0-9]{64})\s+yt-dlp_macos\.zip\s*$/mu)
  if (!match?.[1]) throw new Error('Official yt-dlp checksum is missing')
  return match[1]
}

export async function installMacRuntimeArchive(
  version: string,
  parent: string,
  expectedSha256?: string,
  localArchive?: string,
): Promise<string> {
  await mkdir(parent, { recursive: true })
  const destination = join(parent, version)
  try {
    if ((await readFile(join(destination, '.ha-version'), 'utf8')).trim() === version)
      return destination
  } catch {
    // An absent or incomplete runtime is replaced below.
  }
  const checksum = expectedSha256 ?? (await officialChecksum(version))
  const temporary = await mkdtemp(join(parent, '.install-'))
  try {
    const bytes = localArchive
      ? await readFile(localArchive)
      : Buffer.from(await (await releaseResponse(macRuntimeArchiveUrl(version))).arrayBuffer())
    const actual = createHash('sha256').update(bytes).digest('hex')
    if (actual !== checksum) throw new Error('Official yt-dlp archive checksum mismatch')
    const archive = join(temporary, 'yt-dlp_macos.zip')
    const extracted = join(temporary, 'runtime')
    await writeFile(archive, bytes, { mode: 0o600 })
    await mkdir(extracted)
    const result = await new ProcessRunner().run('ditto', ['-x', '-k', archive, extracted], {
      timeoutMs: 90_000,
    })
    if (result.code !== 0) throw new Error('Could not unpack the official yt-dlp runtime')
    const executable = join(extracted, 'yt-dlp_macos')
    const verified = await new ProcessRunner().run(executable, ['--version'], {
      timeoutMs: 60_000,
    })
    if (verified.code !== 0 || verified.stdout.trim() !== version)
      throw new Error('The unpacked yt-dlp runtime failed version verification')
    await writeFile(join(extracted, '.ha-version'), `${version}\n`, { mode: 0o644 })
    await rm(destination, { recursive: true, force: true })
    await rename(extracted, destination)
    return destination
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}
