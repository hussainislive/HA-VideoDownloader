import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const args = process.argv.slice(2)
const cachedInfoIndex = args.indexOf('--load-info-json')
const cachedInfo =
  cachedInfoIndex >= 0 ? JSON.parse(await readFile(args[cachedInfoIndex + 1], 'utf8')) : undefined
const url = cachedInfo?.webpage_url ?? args.at(-1) ?? ''
const valueAfter = (flag) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

if (args.includes('--version')) {
  process.stdout.write('2099.01.01-fake\n')
  process.exit(0)
}
if (args.includes('-U')) {
  process.stdout.write('yt-dlp is up to date\n')
  process.exit(0)
}
if (args.includes('-J')) {
  if (url.includes('slow-probe')) await new Promise((resolve) => setTimeout(resolve, 2_000))
  if (url.includes('fail-403')) {
    process.stderr.write('ERROR: HTTP Error 403: Forbidden\n')
    process.exit(1)
  }
  if (url.includes('private')) {
    process.stderr.write('ERROR: Private video\n')
    process.exit(1)
  }
  if (url.includes('geo')) {
    process.stderr.write('ERROR: This video is not available in your country\n')
    process.exit(1)
  }
  if (url.includes('offline')) {
    process.stderr.write('ERROR: Unable to connect: Network is unreachable\n')
    process.exit(1)
  }
  process.stdout.write(
    JSON.stringify({
      id: 'fake-id',
      title: url.includes('vertical') ? 'Fake Vertical Video' : 'Fake Video',
      uploader: 'HA Test Engine',
      duration: 10,
      webpage_url: url.includes('cached-only-canonical')
        ? 'https://example.test/canonical-target'
        : url,
      extractor_key: 'Fake',
      formats: [
        {
          format_id: 'v480',
          width: url.includes('vertical') ? 480 : 854,
          height: url.includes('vertical') ? 854 : 480,
          vcodec: 'avc1',
          acodec: 'none',
          tbr: 500,
        },
        {
          format_id: 'v1080',
          width: url.includes('vertical') ? 1080 : 1920,
          height: url.includes('vertical') ? 1920 : 1080,
          vcodec: 'avc1',
          acodec: 'none',
          filesize: 1000000,
        },
        { format_id: 'a1', ext: 'm4a', vcodec: 'none', acodec: 'mp4a', abr: 128, filesize: 100000 },
      ],
    }),
  )
  process.exit(0)
}

const template = valueAfter('-o')
if (!template) process.exit(2)
if (url.includes('cached-only') && cachedInfoIndex < 0) {
  process.stderr.write('ERROR: cached metadata was not reused\n')
  process.exit(1)
}
if (url.includes('cache-expired') && cachedInfoIndex >= 0) {
  process.stderr.write('ERROR: HTTP Error 403: Forbidden\n')
  process.exit(1)
}
if (url.includes('prepare-slow')) await new Promise((resolve) => setTimeout(resolve, 500))
const outputDir = dirname(template)
await mkdir(outputDir, { recursive: true })
const audioFormat = valueAfter('--audio-format')
const container = audioFormat ?? valueAfter('--merge-output-format') ?? 'mp4'
const selector = valueAfter('-f') ?? ''
const finalPath = join(outputDir, `Fake Video [fake-id].${container}`)
const partPath = `${finalPath}.part`
await writeFile(partPath, Buffer.alloc(1_024))
if (url.includes('existing')) {
  await writeFile(finalPath, Buffer.alloc(2_048))
  await rm(partPath)
  process.stdout.write(`[download] ${finalPath} has already been downloaded\n`)
  process.exit(0)
}

let stopped = false
process.on('SIGTERM', () => {
  stopped = true
  process.exit(143)
})
if (url.includes('crash')) process.exit(2)
if (url.includes('disk-full')) {
  process.stderr.write('ERROR: No space left on device\n')
  process.exit(1)
}
if (url.includes('merge-fail') && container === 'mp4') {
  process.stderr.write('ERROR: ffmpeg merge failed\n')
  process.exit(1)
}
if (url.includes('format-fail') && !selector.includes('bv*')) {
  process.stderr.write('ERROR: Requested format is not available\n')
  process.exit(1)
}
if (url.includes('stall')) {
  const marker = join(outputDir, '.stall-seen')
  const seen = await stat(marker).then(
    () => true,
    () => false,
  )
  if (!seen) {
    await writeFile(marker, 'seen')
    setInterval(() => {}, 1_000)
  }
}
for (let step = 1; step <= 10 && !stopped; step += 1) {
  process.stdout.write(`HA|downloading|${step * 100}|1000|NA|500|${10 - step}|NA|NA\n`)
  const delay = url.includes('concurrency')
    ? 500
    : url.includes('perf')
      ? 200
      : url.includes('slow')
        ? 100
        : 8
  await new Promise((resolve) => setTimeout(resolve, delay))
}
process.stderr.write('[Merger] Merging formats into output\n')
if (url.includes('merge-slow')) await new Promise((resolve) => setTimeout(resolve, 2_000))
await writeFile(partPath, Buffer.alloc(2_048))
await rename(partPath, finalPath)
process.stdout.write(`HAFILE|${finalPath}\n`)
