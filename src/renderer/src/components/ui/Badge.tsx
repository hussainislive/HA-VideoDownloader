import { cn } from '@renderer/lib/cn'
import type { HTMLAttributes } from 'react'

type BadgeTone = 'accent' | 'neutral' | 'danger' | 'warning' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const tones: Record<BadgeTone, string> = {
  accent: 'border-line-strong bg-accent-soft text-accent',
  neutral: 'border-line bg-surface-elevated text-fg-body',
  danger: 'border-danger/30 bg-danger-soft text-danger',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  info: 'border-info/30 bg-info-soft text-info',
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'telemetry inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
