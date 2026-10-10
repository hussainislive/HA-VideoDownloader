import { cn } from '@renderer/lib/cn'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated'
}

export function Card({ className, variant = 'glass', ...props }: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'border-line rounded-2xl border',
        variant === 'glass' && 'glass-surface',
        variant === 'solid' && 'bg-surface-solid',
        variant === 'elevated' && 'bg-surface-elevated',
        className,
      )}
      {...props}
    />
  )
}
