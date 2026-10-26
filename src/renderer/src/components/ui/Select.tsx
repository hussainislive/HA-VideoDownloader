import { cn } from '@renderer/lib/cn'
import { COPY } from '@renderer/lib/copy'
import { Check, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

export interface SelectOption {
  disabled?: boolean
  label: string
  value: string
}

interface SelectProps {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  size?: 'compact' | 'default'
  value: string
}

export function Select({
  disabled = false,
  label,
  onChange,
  options,
  size = 'default',
  value,
}: SelectProps): React.JSX.Element {
  const id = useId()
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const activeOption = options[activeIndex]
  const selected = options.find((option) => option.value === value) ?? options[0]

  const move = (direction: 1 | -1): void => {
    if (options.length === 0) return
    let next = activeIndex
    for (let attempt = 0; attempt < options.length; attempt += 1) {
      next = (next + direction + options.length) % options.length
      if (!options[next]?.disabled) break
    }
    setActiveIndex(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      move(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open && activeOption && !activeOption.disabled) onChange(activeOption.value)
      setOpen((current) => !current)
    } else if (event.key === 'Escape') {
      setOpen(false)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(Math.max(0, options.length - 1))
    }
  }

  return (
    <div
      className={cn('relative flex min-w-40 flex-col', size === 'compact' ? 'gap-1' : 'gap-1.5')}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <span className="text-fg-body text-[11px] font-semibold" id={`${id}-label`}>
        {label}
      </span>
      <button
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        className={cn(
          'border-line bg-surface-elevated text-fg-heading hover:border-line-strong flex items-center justify-between gap-3 rounded-xl border px-3 text-left text-xs transition-[border-color,opacity] disabled:cursor-not-allowed disabled:opacity-45',
          size === 'compact' ? 'h-8' : 'h-9',
        )}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex)
          setOpen((current) => !current)
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        type="button"
      >
        <span>{selected?.label ?? COPY.selectPlaceholder}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('text-fg-muted size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <ul
          aria-labelledby={`${id}-label`}
          className="border-line-strong bg-surface-solid shadow-card absolute top-full z-30 mt-1 w-full rounded-xl border p-1"
          id={`${id}-listbox`}
          role="listbox"
        >
          {options.map((option, index) => (
            <li
              aria-disabled={option.disabled}
              aria-selected={option.value === value}
              className={cn(
                'text-fg-body flex min-h-8 items-center justify-between rounded-lg px-2.5 text-xs transition-colors outline-none',
                activeIndex === index && 'bg-accent-soft text-accent-glow',
                option.disabled && 'cursor-not-allowed opacity-45',
              )}
              id={`${id}-option-${index}`}
              key={option.value}
              onMouseDown={(event) => {
                event.preventDefault()
                if (option.disabled) return
                onChange(option.value)
                setOpen(false)
              }}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
            >
              <span>{option.label}</span>
              {option.value === value ? <Check aria-hidden="true" className="size-3.5" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
