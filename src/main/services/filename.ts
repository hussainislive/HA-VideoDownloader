import { readdir, rm } from 'node:fs/promises'
import { extname, join } from 'node:path'

export function safeFilenameStem(title: string, mediaId: string): string {
  const safeTitle = [...title]
    .map((character) =>
      character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/u.test(character) ? '_' : character,
    )
    .join('')
    .trim()
    .slice(0, 180)
  return `${safeTitle || 'download'} [${mediaId}]`
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
  await Promise.all(candidates.map((name) => rm(join(outputDir, name), { force: true })))
  return candidates
}
