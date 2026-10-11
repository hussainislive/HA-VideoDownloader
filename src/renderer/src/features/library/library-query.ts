import type { LibraryItem } from '@shared/types/history'

export type LibraryFilter = 'all' | 'video' | 'audio'
export type LibrarySort = 'newest' | 'oldest' | 'largest' | 'alphabetical'

export interface LibraryQuery {
  filter: LibraryFilter
  query: string
  sort: LibrarySort
}

export function queryLibrary(items: readonly LibraryItem[], options: LibraryQuery): LibraryItem[] {
  const query = options.query.trim().toLocaleLowerCase()
  const filtered = items.filter((item) => {
    if (options.filter !== 'all' && item.options.kind !== options.filter) return false
    if (!query) return true
    return `${item.title} ${item.uploader ?? ''} ${item.platform}`
      .toLocaleLowerCase()
      .includes(query)
  })

  return [...filtered].sort((left, right) => {
    if (options.sort === 'oldest') return left.completedAt.localeCompare(right.completedAt)
    if (options.sort === 'largest') return right.fileSize - left.fileSize
    if (options.sort === 'alphabetical') return left.title.localeCompare(right.title)
    return right.completedAt.localeCompare(left.completedAt)
  })
}
