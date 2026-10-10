import { cn } from '@renderer/lib/cn'
import { useId } from 'react'

interface SwitchProps {
  checked: boolean
  description?: string
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function Switch({
  checked,
  description,
  disabled = false,
  label,
  onChange,
}: SwitchProps): React.JSX.Element {
  const id = useId()
  return (
    <label
      className={cn('flex items-center justify-between gap-4', disabled && 'opacity-45')}
      htmlFor={id}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-fg-heading text-xs font-semibold">{label}</span>
        {description ? <span className="text-fg-muted text-[11px]">{description}</span> : null}
      </span>
      <button
        aria-checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        className={cn(
          'duration-base relative h-5 w-9 shrink-0 rounded-full border transition-[background-color,border-color,opacity]',
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-elevated',
        )}
        disabled={disabled}
        id={id}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            'bg-fg-heading duration-base absolute top-0.5 left-0.5 size-3.5 rounded-full transition-transform',
            checked && 'bg-accent-on translate-x-4',
          )}
        />
      </button>
      {description ? (
        <span className="sr-only" id={`${id}-description`}>
          {description}
        </span>
      ) : null}
    </label>
  )
}
