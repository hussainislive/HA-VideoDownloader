import { cn } from '@renderer/lib/cn'
import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

interface SegmentOption<T extends string> {
  label: string
  value: T
}

interface SegmentedControlProps<T extends string> {
  label: string
  onChange: (value: T) => void
  options: readonly SegmentOption<T>[]
  value: T
}

export function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>): React.JSX.Element {
  const layoutId = useId()
  const reduceMotion = useReducedMotion()
  return (
    <div
      aria-label={label}
      className="border-line bg-surface-solid inline-flex rounded-full border p-0.5"
      role="group"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            aria-pressed={active}
            className={cn(
              'relative min-w-16 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
              active ? 'text-fg-heading' : 'text-fg-muted hover:text-fg-body',
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {active ? (
              <motion.span
                className="border-line-strong bg-surface-elevated absolute inset-0 rounded-full border shadow-sm"
                layoutId={`segment-${layoutId}`}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
