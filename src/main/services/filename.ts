import { readdir, rm } from 'node:fs/promises'
import { extname, join } from 'node:path'

const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu
const RETRIABLE_LOCK_CODES = new Set(['EBUSY', 'EPERM'])
const FILE_UNLOCK_RETRIES = 5
const FILE_UNLOCK_RETRY_MS = 50

export function safeFilenameStem(title: string, mediaId: string): string {
  const cleanedTitle = [...title]
    .map((character) =>
      character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/u.test(character) ? '_' : character,
    )
    .join('')
    .trim()
  const shortenedTitle = [...cleanedTitle]
    .slice(0, 180)
    .join('')
    .replace(/[ .]+$/u, '')
  const safeTitle = WINDOWS_RESERVED_NAME.test(shortenedTitle)
    ? `_${shortenedTitle}`
    : shortenedTitle
  return `${safeTitle || 'download'} [${mediaId}]`
}

function isRetriableLock(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    RETRIABLE_LOCK_CODES.has(error.code)
  )
}

async function removeAfterUnlock(path: string): Promise<void> {
  for (let attempt = 0; attempt <= FILE_UNLOCK_RETRIES; attempt += 1) {
    try {
      await rm(path, { force: true })
      return
    } catch (error) {
      if (!isRetriableLock(error) || attempt === FILE_UNLOCK_RETRIES) throw error
      await new Promise((resolve) => setTimeout(resolve, FILE_UNLOCK_RETRY_MS))
    }
  }
}

export async function cleanupJobPartials(
  outputDir: string,
  title: string,
  mediaId: string,
): Promise<string[]> {
  const stem = safeFilenameStem(title, mediaId)
  const names = await readdir(outputDir).catch(() => [])
  const candidates = names.filter((name) => {
    if (!name.startsWith(stem)) return false
    const extension = extname(name).toLocaleLowerCase()
    return (
      extension === '.part' ||
      extension === '.ytdl' ||
      name.includes('.temp.') ||
      /\.f\d+\./u.test(name)
    )
  })
  await Promise.all(candidates.map((name) => removeAfterUnlock(join(outputDir, name))))
  return candidates
}
