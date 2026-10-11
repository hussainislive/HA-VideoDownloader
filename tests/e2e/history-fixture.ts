import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { HistoryItem } from '../../src/shared/types/history'

export interface HistoryFixture {
  items: HistoryItem[]
  paths: string[]
}

export async function createHistoryFixture(
  userData: string,
  count: number,
  missing = new Set<number>(),
): Promise<HistoryFixture> {
  const directory = join(userData, 'library-files')
  await mkdir(directory, { recursive: true })
  const paths: string[] = []
  const items = await Promise.all(
    Array.from({ length: count }, async (_, index): Promise<HistoryItem> => {
      const kind = index % 3 === 1 ? 'audio' : 'video'
      const extension = kind === 'audio' ? 'mp3' : 'mp4'
      const filePath = join(directory, `history-${index}.${extension}`)
      paths.push(filePath)
      if (!missing.has(index)) await writeFile(filePath, Buffer.alloc(1_024 + index))
      return {
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        url: `https://example.test/history-${index}`,
        title:
          index === 2
            ? 'رحلة إبداعية طويلة جدًا 🎬 — A deliberately long multilingual media title for layout coverage'
            : `${kind === 'audio' ? 'Focus Audio' : 'Studio Video'} ${index + 1}`,
        uploader: index % 2 === 0 ? 'Hussain Studio' : 'Creative Archive',
        platform: index % 2 === 0 ? 'YouTube' : 'Vimeo',
        options: {
          kind,
          quality: 1080,
          container: 'mp4',
          audioFormat: 'mp3',
          bitrate: 320,
          embedMetadata: true,
        },
        filePath,
        fileSize: 1_024 + index,
        durationSec: 90 + index,
        completedAt: new Date(Date.UTC(2026, 9, 10, 12, 0, count - index)).toISOString(),
      }
    }),
  )
  return { items, paths }
}
