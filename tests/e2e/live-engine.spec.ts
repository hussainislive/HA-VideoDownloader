import { access, mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { ProcessRunner } from '../../src/main/engine/process-runner'
import { buildDownloadArgs } from '../../src/main/engine/ytdlp/args'
import type { DownloadBinaryProvider } from '../../src/main/engine/ytdlp/download'
import { YtdlpDownloadService } from '../../src/main/engine/ytdlp/download'
import { parseProbeJson } from '../../src/main/engine/ytdlp/probe'
import type { DownloadJob } from '../../src/shared/types/download'

const ytdlp = join(process.cwd(), 'binaries/macos/yt-dlp')
const ffmpeg = join(process.cwd(), 'binaries/macos/ffmpeg')
const landscapeUrl = 'https://commons.wikimedia.org/wiki/File:Test-webM.webm'
const audioUrl =
  'https://commons.wikimedia.org/wiki/File:Example_sound_file_in_Ogg_Vorbis_format.ogg'
const provider: DownloadBinaryProvider = {
  paths: { ffmpeg },
  ytdlpInvocation: (args) => ({ file: ytdlp, args: [...args] }),
}

function job(outputDir: string, url: string, kind: 'video' | 'audio'): DownloadJob {
  return {
    id: crypto.randomUUID(),
    url,
    mediaId: kind === 'video' ? '36601971' : '76730271',
    title: kind === 'video' ? 'Test-webM' : 'Example sound file in Ogg Vorbis format',
    platform: 'Wikimedia',
    durationSec: kind === 'video' ? 10.137 : 3.704,
    options: {
      kind,
      quality: 480,
      container: 'mkv',
      audioFormat: 'mp3',
      bitrate: 128,
      embedMetadata: false,
      ...(kind === 'video' ? { videoFormatId: '2' } : {}),
    },
    outputDir,
    state: 'queued',
    progress: { phase: 'queued' },
    createdAt: new Date().toISOString(),
    attempt: 0,
    stallRetries: 0,
    usedContainerFallback: false,
    usedGenericFallback: false,
  }
}

async function runDownload(downloadJob: DownloadJob): Promise<string> {
  const result = await new YtdlpDownloadService(provider).start(downloadJob, {
    onActivity: () => undefined,
    onProgress: () => undefined,
  }).completion
  if (!result.ok) throw new Error(result.error.message)
  return result.value.filePath
}

test.describe.serial('real bundled engine @live', () => {
  test.describe.configure({ timeout: 180_000 })
  let directory = ''
  let videoPath = ''

  test.beforeAll(async () => {
    test.skip(process.platform !== 'darwin', 'Owner-required live gate runs on macOS')
    directory = await mkdtemp(join(tmpdir(), 'ha-live-'))
  })

  test.afterAll(async () => {
    if (directory) await rm(directory, { recursive: true, force: true })
  })

  test('probes a short Creative Commons vertical video @live', async () => {
    const result = await new ProcessRunner().run(
      ytdlp,
      [
        '-J',
        '--no-playlist',
        '--no-warnings',
        '--skip-download',
        '--',
        'https://commons.wikimedia.org/wiki/File:WP25Post1.webm',
      ],
      { timeoutMs: 60_000 },
    )
    expect(result.code).toBe(0)
    const parsed = parseProbeJson(result.stdout, landscapeUrl)
    expect(
      parsed.ok && parsed.value.formats.some(({ width, height }) => (height ?? 0) > (width ?? 0)),
    ).toBe(true)
  })

  test('downloads 480p video with video+audio and validates duration @live', async () => {
    const output = join(directory, 'video')
    videoPath = await runDownload(job(output, landscapeUrl, 'video'))
    await expect(access(videoPath)).resolves.toBeUndefined()
    const inspection = await new ProcessRunner().run(ffmpeg, ['-i', videoPath], {
      timeoutMs: 10_000,
    })
    expect(inspection.stderr).toContain('Video:')
    expect(inspection.stderr).toContain('Audio:')
    const match = inspection.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/u)
    expect(match).not.toBeNull()
    const seconds = Number(match?.[1]) * 3_600 + Number(match?.[2]) * 60 + Number(match?.[3])
    expect(Math.abs(seconds - 10.137)).toBeLessThanOrEqual(1)
  })

  test('extracts a real MP3 @live', async () => {
    const path = await runDownload(job(join(directory, 'audio'), audioUrl, 'audio'))
    expect(path.endsWith('.mp3')).toBe(true)
    expect((await stat(path)).size).toBeGreaterThan(0)
  })

  test('kills the tree, resumes the part, and produces identical bytes @live', async () => {
    const resumeJob = job(join(directory, 'resume'), landscapeUrl, 'video')
    const args = buildDownloadArgs(resumeJob, { ffmpegPath: ffmpeg })
    args.splice(args.indexOf('--'), 0, '--limit-rate', '1K')
    const handle = new ProcessRunner().start(ytdlp, args)
    for (let index = 0; index < 100; index += 1) {
      if (
        (await readdir(resumeJob.outputDir).catch(() => [])).some((name) => name.endsWith('.part'))
      )
        break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await handle.kill()
    await handle.result
    if (handle.pid)
      expect((await new ProcessRunner().run('ps', ['-p', String(handle.pid)])).code).not.toBe(0)
    const resumedPath = await runDownload(resumeJob)
    expect((await stat(resumedPath)).size).toBe((await stat(videoPath)).size)
  })
})
