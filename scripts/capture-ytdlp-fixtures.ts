import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface Capture {
  code: number | null
  stdout: string
  stderr: string
}

const platformFolder =
  process.platform === 'win32' ? 'win' : process.arch === 'arm64' ? 'macos-arm64' : 'macos-x64'
const binary = join(
  process.cwd(),
  'binaries',
  platformFolder,
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
)
const destination = join(process.cwd(), 'tests/fixtures/ytdlp')
const probes = [
  ['landscape.json', 'https://commons.wikimedia.org/wiki/File:Portraits-HD.webm'],
  ['vertical.json', 'https://commons.wikimedia.org/wiki/File:WP25Post1.webm'],
  [
    'audio-only.json',
    'https://commons.wikimedia.org/wiki/File:Example_sound_file_in_Ogg_Vorbis_format.ogg',
  ],
] as const

function run(args: readonly string[]): Promise<Capture> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [...args], {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString('utf8')))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString('utf8')))
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, stdout, stderr }))
  })
}

function sanitizedProbe(raw: string, sourceUrl: string): string {
  const value = JSON.parse(raw) as Record<string, unknown>
  const formats = Array.isArray(value.formats) ? value.formats : []
  return JSON.stringify(
    {
      sourceUrl,
      capturedWith: 'yt-dlp 2026.08.19',
      id: value.id,
      title: value.title,
      uploader: value.uploader,
      duration: value.duration,
      thumbnail: value.thumbnail,
      webpage_url: value.webpage_url,
      extractor_key: value.extractor_key,
      formats: formats.map((candidate) => {
        const format = candidate as Record<string, unknown>
        return {
          format_id: format.format_id,
          width: format.width,
          height: format.height,
          fps: format.fps,
          ext: format.ext,
          vcodec: format.vcodec,
          acodec: format.acodec,
          tbr: format.tbr,
          abr: format.abr,
          filesize: format.filesize,
          filesize_approx: format.filesize_approx,
        }
      }),
    },
    null,
    2,
  )
}

async function main(): Promise<void> {
  await mkdir(destination, { recursive: true })
  for (const [name, url] of probes) {
    const captured = await run([
      '-J',
      '--no-playlist',
      '--no-warnings',
      '--skip-download',
      '--',
      url,
    ])
    if (captured.code !== 0) throw new Error(`Fixture probe failed for ${url}: ${captured.stderr}`)
    await writeFile(join(destination, name), `${sanitizedProbe(captured.stdout, url)}\n`)
    process.stdout.write(`captured ${name}\n`)
  }
  const failures = [
    [
      'unavailable.stderr.txt',
      [
        '-J',
        '--no-playlist',
        '--no-warnings',
        '--skip-download',
        '--',
        'https://www.youtube.com/watch?v=BaW_jenozKc',
      ],
    ],
    [
      'unsupported.stderr.txt',
      ['-J', '--no-playlist', '--no-warnings', '--skip-download', '--', 'https://example.com/'],
    ],
    [
      'offline.stderr.txt',
      [
        '--proxy',
        'http://127.0.0.1:9',
        '-J',
        '--no-playlist',
        '--no-warnings',
        '--skip-download',
        '--',
        'https://commons.wikimedia.org/wiki/File:Portraits-HD.webm',
      ],
    ],
  ] as const
  for (const [name, args] of failures) {
    const captured = await run(args)
    const redacted = captured.stderr.replace(/https?:\/\/\S+/gu, '[URL redacted]')
    await writeFile(join(destination, name), redacted)
    process.stdout.write(`captured ${name}\n`)
  }
}

await main()
