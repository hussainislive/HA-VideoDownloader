import { COPY } from '@renderer/lib/copy'
import { X } from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { IconButton } from './IconButton'

interface ToastItem {
  action?: ToastAction
  id: number
  message: string
}

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastContextValue {
  showToast: (message: string, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
let nextToastId = 0

export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])
  const timers = useRef(new Map<number, number>())
  const dismiss = useCallback((id: number): void => {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])
  const showToast = useCallback(
    (message: string, action?: ToastAction): void => {
      const id = ++nextToastId
      const item: ToastItem = { id, message, ...(action ? { action } : {}) }
      setToasts((current) => [...current, item].slice(-3))
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), 4_000),
      )
    },
    [dismiss],
  )
  const value = useMemo(() => ({ showToast }), [showToast])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current.clear()
    },
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            className="border-line-strong bg-surface-overlay text-fg-body shadow-card pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs"
            key={toast.id}
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.action ? (
              <button
                className="text-accent hover:text-accent-glow shrink-0 font-semibold transition-colors"
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
                type="button"
              >
                {toast.action.label}
              </button>
            ) : null}
            <IconButton
              label={COPY.accessibility.dismissNotification}
              onClick={() => dismiss(toast.id)}
              size="compact"
            >
              <X aria-hidden="true" className="size-3.5" />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
