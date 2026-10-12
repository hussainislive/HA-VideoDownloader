import { Checkbox } from '@renderer/components/ui/Checkbox'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { Select } from '@renderer/components/ui/Select'
import { Spinner } from '@renderer/components/ui/Spinner'
import { useToast } from '@renderer/components/ui/Toast'
import { COPY } from '@renderer/lib/copy'
import { formatBytes } from '@renderer/lib/format'
import { useLibraryStore } from '@renderer/store/library-store'
import { navigateToTab } from '@renderer/store/ui-store'
import type { LibraryItem } from '@shared/types/history'
import { FolderClock, Search, SearchX } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { LibraryList } from './components/LibraryList'
import { type LibraryFilter, type LibrarySort, queryLibrary } from './library-query'
import { useLibrarySync } from './use-library-sync'

const SORT_OPTIONS = [
  { value: 'newest', label: COPY.library.sorts.newest },
  { value: 'oldest', label: COPY.library.sorts.oldest },
  { value: 'largest', label: COPY.library.sorts.largest },
  { value: 'alphabetical', label: COPY.library.sorts.alphabetical },
] as const

export default function LibraryScreen(): React.JSX.Element {
  useLibrarySync()
  const items = useLibraryStore((state) => state.items)
  const hydration = useLibraryStore((state) => state.hydration)
  const error = useLibraryStore((state) => state.error)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const [sort, setSort] = useState<LibrarySort>('newest')
  const [pendingDelete, setPendingDelete] = useState<LibraryItem>()
  const [deleteFile, setDeleteFile] = useState(false)
  const { showToast } = useToast()

  const visibleItems = useMemo(
    () => queryLibrary(items, { filter, query, sort }),
    [filter, items, query, sort],
  )
  const counts = useMemo(
    () => ({
      all: items.length,
      audio: items.filter((item) => item.options.kind === 'audio').length,
      video: items.filter((item) => item.options.kind === 'video').length,
    }),
    [items],
  )
  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: `${COPY.library.all} (${counts.all})` },
      { value: 'video' as const, label: `${COPY.library.video} (${counts.video})` },
      { value: 'audio' as const, label: `${COPY.library.audio} (${counts.audio})` },
    ],
    [counts],
  )

  const refreshAfterFailure = useCallback(async (): Promise<void> => {
    const result = await window.api.library.list()
    if (result.ok) useLibraryStore.getState().setItems(result.value)
  }, [])

  const runFileAction = useCallback(
    async (item: LibraryItem, action: 'play' | 'open'): Promise<void> => {
      const result =
        action === 'play'
          ? await window.api.shell.openFile(item.filePath)
          : await window.api.shell.showInFolder(item.filePath)
      if (!result.ok) {
        showToast(result.error.message)
        await refreshAfterFailure()
      }
    },
    [refreshAfterFailure, showToast],
  )

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!pendingDelete) return
    const result = await window.api.library.delete(pendingDelete.id, deleteFile)
    if (result.ok) {
      useLibraryStore.getState().setItems(result.value)
      showToast(COPY.library.deleted)
    } else showToast(result.error.message)
    setPendingDelete(undefined)
    setDeleteFile(false)
  }, [deleteFile, pendingDelete, showToast])

  const totalBytes = items.reduce((sum, item) => sum + item.fileSize, 0)
  const hasQuery = query.trim().length > 0 || filter !== 'all'

  return (
    <div
      className="mx-auto flex h-full w-full max-w-[1200px] flex-col"
      data-testid="library-screen"
    >
      <header className="mb-3 flex shrink-0 flex-wrap items-end gap-2">
        <label className="relative min-w-52 flex-1" htmlFor="library-search">
          <span className="sr-only">{COPY.library.searchLabel}</span>
          <Search
            aria-hidden="true"
            className="text-fg-muted pointer-events-none absolute top-2.5 left-3 size-4"
          />
          <input
            className="border-line bg-surface-solid text-fg-heading placeholder:text-fg-muted focus:border-accent h-9 w-full rounded-xl border pr-3 pl-9 text-xs"
            id="library-search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={COPY.library.searchPlaceholder}
            type="search"
            value={query}
          />
        </label>
        <SegmentedControl
          label={COPY.library.title}
          onChange={setFilter}
          options={filterOptions}
          value={filter}
        />
        <Select
          label={COPY.library.sortLabel}
          onChange={(value) => setSort(value as LibrarySort)}
          options={SORT_OPTIONS}
          value={sort}
        />
      </header>

      {hydration === 'loading' ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner label={COPY.accessibility.loading} />
        </div>
      ) : hydration === 'error' ? (
        <EmptyState
          description={error ?? COPY.library.unavailableDescription}
          icon={FolderClock}
          title={COPY.library.unavailableTitle}
        />
      ) : visibleItems.length > 0 ? (
        <LibraryList
          items={visibleItems}
          onDelete={(item) => setPendingDelete(item)}
          onOpen={(item) => void runFileAction(item, 'open')}
          onPlay={(item) => void runFileAction(item, 'play')}
        />
      ) : hasQuery ? (
        <EmptyState
          description={COPY.library.noResultsDescription}
          icon={SearchX}
          title={COPY.library.noResults(query.trim())}
        />
      ) : (
        <EmptyState
          actionLabel={COPY.library.openDownloader}
          description={COPY.library.emptyDescription}
          icon={FolderClock}
          onAction={() => navigateToTab('downloader')}
          title={COPY.library.emptyTitle}
        />
      )}

      <footer className="border-line-subtle text-fg-muted telemetry mt-2 flex h-7 shrink-0 items-center border-t pt-2 text-[10px]">
        {COPY.library.summary(items.length, formatBytes(totalBytes))}
      </footer>

      <ConfirmDialog
        confirmLabel={COPY.library.deleteConfirm}
        description={COPY.library.deleteDescription}
        onCancel={() => {
          setPendingDelete(undefined)
          setDeleteFile(false)
        }}
        onConfirm={() => void confirmDelete()}
        open={pendingDelete !== undefined}
        title={COPY.library.deleteTitle}
      >
        <Checkbox checked={deleteFile} label={COPY.library.deleteFile} onChange={setDeleteFile} />
      </ConfirmDialog>
    </div>
  )
}
