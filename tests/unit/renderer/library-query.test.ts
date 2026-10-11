import { queryLibrary } from '@renderer/features/library/library-query'
import type { LibraryItem } from '@shared/types/history'
import { describe, expect, it } from 'vitest'

function item(overrides: Partial<LibraryItem>): LibraryItem {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    url: 'https://example.test/media',
    title: 'Alpha Video',
    uploader: 'Studio',
    platform: 'YouTube',
    options: {
      kind: 'video',
      quality: 1080,
      container: 'mp4',
      audioFormat: 'mp3',
      bitrate: 320,
      embedMetadata: true,
    },
    filePath: '/downloads/alpha.mp4',
    fileSize: 100,
    completedAt: '2026-10-10T12:00:00.000Z',
    fileExists: true,
    ...overrides,
  }
}

describe('queryLibrary', () => {
  const items = [
    item({ title: 'Zulu Video', fileSize: 100, completedAt: '2026-10-10T12:00:00.000Z' }),
    item({
      id: '00000000-0000-4000-8000-000000000002',
      title: 'Alpha Audio',
      uploader: 'صوت إبداعي',
      fileSize: 500,
      completedAt: '2026-10-09T12:00:00.000Z',
      options: {
        kind: 'audio',
        quality: 1080,
        container: 'mp4',
        audioFormat: 'mp3',
        bitrate: 320,
        embedMetadata: true,
      },
    }),
  ]

  it('searches title, uploader, and platform without losing Unicode text', () => {
    expect(queryLibrary(items, { filter: 'all', query: 'إبداعي', sort: 'newest' })).toHaveLength(1)
    expect(queryLibrary(items, { filter: 'all', query: 'youtube', sort: 'newest' })).toHaveLength(2)
  })

  it('filters media kinds and supports every specified sort order', () => {
    expect(queryLibrary(items, { filter: 'audio', query: '', sort: 'newest' })[0]?.title).toBe(
      'Alpha Audio',
    )
    expect(queryLibrary(items, { filter: 'all', query: '', sort: 'oldest' })[0]?.title).toBe(
      'Alpha Audio',
    )
    expect(queryLibrary(items, { filter: 'all', query: '', sort: 'largest' })[0]?.fileSize).toBe(
      500,
    )
    expect(queryLibrary(items, { filter: 'all', query: '', sort: 'alphabetical' })[0]?.title).toBe(
      'Alpha Audio',
    )
  })
})
