import { COPY } from '@renderer/lib/copy'
import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Button } from './Button'

interface ConfirmDialogProps {
  children?: ReactNode
  confirmLabel?: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
}

export function ConfirmDialog({
  children,
  confirmLabel = COPY.actions.confirm,
  description,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll<HTMLButtonElement>('button')
    focusable?.[0]?.focus()
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel()
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onCancel, open])

  if (!open) return null
  return createPortal(
    <div
      className="bg-canvas-from/80 fixed inset-0 z-50 flex items-center justify-center p-6"
      role="presentation"
    >
      <div
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="border-line-strong bg-surface-solid shadow-card w-full max-w-sm rounded-2xl border p-5"
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="text-fg-heading text-base font-bold" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="text-fg-muted mt-2 text-xs leading-5" id="confirm-dialog-description">
          {description}
        </p>
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel}>{COPY.actions.cancel}</Button>
          <Button onClick={onConfirm} variant="danger">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
