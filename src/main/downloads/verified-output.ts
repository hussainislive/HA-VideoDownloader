import { lstat, readdir } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

import type { DownloadJob } from '@shared/types/download'

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.mov', '.m4v', '.flv', '.avi', '.ts'])
const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.wav',
  '.opus',
  '.ogg',
  '.webm',
  '.aac',
  '.flac',
])

function isExpectedFile(path: string, job: DownloadJob): boolean {
  const outputDir = resolve(job.outputDir)
  const relativePath = relative(outputDir, path)
  const extension = extname(path).toLocaleLowerCase()
  const allowed = job.options.kind === 'video' ? VIDEO_EXTENSIONS : AUDIO_EXTENSIONS
  return (
    isAbsolute(path) &&
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath) &&
    allowed.has(extension)
  )
}

async function positiveFile(path: string): Promise<{ path: string; size: number } | undefined> {
  try {
    const file = await lstat(path)
    return file.isFile() && file.size > 0 ? { path, size: file.size } : undefined
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

export async function verifyCompletedOutput(
  job: DownloadJob,
  reportedPath: string,
): Promise<{ path: string; size: number }> {
  const reported = reportedPath.trim()
  if (reported && isExpectedFile(reported, job)) {
    const verified = await positiveFile(reported)
    if (verified) return verified
  }

  const suffix = `[${job.mediaId}]`
  const names = await readdir(job.outputDir)
  const candidates = names.filter((name) => {
    const stem = basename(name, extname(name))
    return stem.endsWith(suffix) && isExpectedFile(join(job.outputDir, name), job)
  })
  const found = (
    await Promise.all(candidates.map((name) => positiveFile(join(job.outputDir, name))))
  ).filter((candidate) => candidate !== undefined)
  const only = found[0]
  if (found.length === 1 && only) return only
  throw new Error(
    found.length > 1
      ? 'Multiple matching completed media files were found.'
      : 'The completed media file was not found or is empty.',
  )
}
