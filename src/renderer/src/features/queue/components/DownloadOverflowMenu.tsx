import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import { Copy, Ellipsis, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MENU_GAP = 4
const VIEWPORT_MARGIN = 8

interface MenuPosition {
  left: number
  top: number
}

interface DownloadOverflowMenuProps {
  id: string
  onCopy: () => void
  onDelete: () => void
  onRemove: () => void
}

export function DownloadOverflowMenu({
  id,
  onCopy,
  onDelete,
  onRemove,
}: DownloadOverflowMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const positionMenu = useCallback((): void => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const triggerRect = trigger.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - menuRect.width - VIEWPORT_MARGIN)
    const left = Math.min(Math.max(VIEWPORT_MARGIN, triggerRect.right - menuRect.width), maxLeft)
    const below = triggerRect.bottom + MENU_GAP
    const above = triggerRect.top - menuRect.height - MENU_GAP
    const preferredTop =
      below + menuRect.height <= window.innerHeight - VIEWPORT_MARGIN ? below : above
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - menuRect.height - VIEWPORT_MARGIN)
    const top = Math.min(Math.max(VIEWPORT_MARGIN, preferredTop), maxTop)

    setPosition({ left, top })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    positionMenu()
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    return () => {
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
    }
  }, [open, positionMenu])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent): void => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      const target = event.target as Node
      if (event instanceof MouseEvent && menuRef.current?.contains(target)) return
      if (event instanceof MouseEvent && triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const runAction = (action: () => void): void => {
    setOpen(false)
    action()
  }

  const menuId = `${id}-actions-menu`
  return (
    <div>
      <IconButton
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        label={COPY.queue.more}
        onClick={() => {
          setPosition(null)
          setOpen((current) => !current)
        }}
        ref={triggerRef}
      >
        <Ellipsis aria-hidden="true" className="size-4" />
      </IconButton>
      {open
        ? createPortal(
            <div
              aria-label={COPY.queue.more}
              className="border-line-strong bg-surface-solid shadow-card fixed z-50 w-36 rounded-xl border p-1 text-[10px]"
              id={menuId}
              ref={menuRef}
              role="menu"
              style={{
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                visibility: position ? 'visible' : 'hidden',
              }}
            >
              <button
                className="hover:bg-surface-elevated flex w-full items-center gap-2 rounded-lg px-2.5 py-2"
                onClick={() => runAction(onCopy)}
                role="menuitem"
                type="button"
              >
                <Copy aria-hidden="true" className="size-3" />
                {COPY.queue.copyLink}
              </button>
              <button
                className="hover:bg-surface-elevated flex w-full items-center gap-2 rounded-lg px-2.5 py-2"
                onClick={() => runAction(onRemove)}
                role="menuitem"
                type="button"
              >
                <X aria-hidden="true" className="size-3" />
                {COPY.queue.remove}
              </button>
              <button
                className="text-danger hover:bg-danger-soft flex w-full items-center gap-2 rounded-lg px-2.5 py-2"
                onClick={() => runAction(onDelete)}
                role="menuitem"
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-3" />
                {COPY.queue.deleteFile}
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
