import { cn } from '@renderer/lib/cn'
import type { HTMLAttributes } from 'react'

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>): React.JSX.Element {
  return (
    <kbd
      className={cn(
        'telemetry border-line bg-surface-elevated text-fg-muted inline-flex min-w-5 items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
