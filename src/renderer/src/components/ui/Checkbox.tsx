import { cn } from '@renderer/lib/cn'
import { Check } from 'lucide-react'
import { useId } from 'react'

interface CheckboxProps {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function Checkbox({
  checked,
  disabled = false,
  label,
  onChange,
}: CheckboxProps): React.JSX.Element {
  const id = useId()
  return (
    <label
      className={cn(
        'text-fg-body inline-flex items-center gap-2 text-xs',
        disabled && 'opacity-45',
      )}
      htmlFor={id}
    >
      <span className="relative size-[18px] shrink-0">
        <input
          checked={checked}
          className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          disabled={disabled}
          id={id}
          onChange={(event) => onChange(event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="border-line-strong bg-surface-elevated text-accent-on peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:shadow-focus flex size-[18px] items-center justify-center rounded-sm border transition-colors">
          {checked ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
        </span>
      </span>
      {label}
    </label>
  )
}
