import { cn } from '@renderer/lib/cn'

interface ProgressBarProps {
  indeterminate?: boolean
  label: string
  value?: number
}

export function ProgressBar({
  indeterminate = false,
  label,
  value = 0,
}: ProgressBarProps): React.JSX.Element {
  const normalized = Math.min(100, Math.max(0, value))
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={indeterminate ? undefined : normalized}
      className="bg-surface-elevated h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
    >
      <span
        className={cn(
          'bg-accent shadow-glow-sm block h-full origin-left rounded-full transition-transform duration-200 ease-linear',
          indeterminate && 'skeleton-shimmer w-full',
        )}
        style={{ transform: indeterminate ? 'scaleX(1)' : `scaleX(${normalized / 100})` }}
      />
    </div>
  )
}
