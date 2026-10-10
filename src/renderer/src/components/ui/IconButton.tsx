import { cn } from '@renderer/lib/cn'
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'compact' | 'default'
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { children, className, label, size = 'default', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(
        'app-no-drag border-line bg-surface-elevated text-fg-muted duration-fast hover:border-line-strong hover:text-fg-heading inline-flex items-center justify-center rounded-xl border transition-[transform,opacity,background-color,border-color,color] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45',
        size === 'compact' ? 'size-7' : 'size-10 rounded-full',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
})
