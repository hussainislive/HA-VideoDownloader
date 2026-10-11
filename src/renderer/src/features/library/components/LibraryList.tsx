import type { LibraryItem } from '@shared/types/history'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

import { HistoryRow } from './HistoryRow'

interface LibraryListProps {
  items: readonly LibraryItem[]
  onDelete: (item: LibraryItem) => void
  onOpen: (item: LibraryItem) => void
  onPlay: (item: LibraryItem) => void
}

const ROW_HEIGHT = 84
const VIRTUALIZE_AFTER = 50

export function LibraryList({
  items,
  onDelete,
  onOpen,
  onPlay,
}: LibraryListProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtual = items.length > VIRTUALIZE_AFTER
  // TanStack Virtual owns mutable measurements; React Compiler must not memoize this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: virtual ? items.length : 0,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => items[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-1" data-testid="library-list" ref={scrollRef}>
      {virtual ? (
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((row) => {
            const item = items[row.index]
            if (!item) return null
            return (
              <div
                className="absolute top-0 left-0 w-full pb-2"
                key={item.id}
                style={{ transform: `translateY(${row.start}px)` }}
              >
                <HistoryRow item={item} onDelete={onDelete} onOpen={onOpen} onPlay={onPlay} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <HistoryRow
              item={item}
              key={item.id}
              onDelete={onDelete}
              onOpen={onOpen}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
