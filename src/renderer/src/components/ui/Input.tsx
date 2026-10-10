import { cn } from '@renderer/lib/cn'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  compact?: boolean
  error?: string
  label: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, compact = false, error, id, label, ...props },
  ref,
) {
  const inputId = id ?? `input-${label.toLowerCase().replaceAll(' ', '-')}`
  const errorId = `${inputId}-error`
  return (
    <label
      className="text-fg-body flex min-w-0 flex-col gap-1.5 text-[11px] font-semibold"
      htmlFor={inputId}
    >
      {label}
      <input
        ref={ref}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          'border-line bg-surface-elevated text-fg-heading placeholder:text-fg-muted hover:border-line-strong focus:border-accent w-full rounded-xl border px-3 text-[13px] transition-[border-color,opacity] disabled:cursor-not-allowed disabled:opacity-45',
          compact ? 'h-9' : 'h-12',
          error && 'border-danger',
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? (
        <span className="text-danger text-[10px] font-medium" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  )
})
