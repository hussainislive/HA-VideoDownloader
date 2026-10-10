import { cn } from '@renderer/lib/cn'
import { LoaderCircle } from 'lucide-react'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on shadow-glow-cta hover:bg-accent-glow disabled:hover:bg-accent',
  secondary:
    'border border-line bg-surface-elevated text-fg-body hover:border-line-strong hover:text-fg-heading',
  danger:
    'border border-danger/30 bg-danger-soft text-danger hover:border-danger/60 hover:bg-danger/20',
  ghost: 'text-fg-muted hover:bg-surface-elevated hover:text-fg-heading',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-10 px-4 text-xs',
  lg: 'h-11 px-7 text-[13px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, disabled, loading = false, size = 'md', variant = 'secondary', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'duration-fast ease-standard inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,opacity,background-color,border-color,color] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      <span className={cn(loading && 'opacity-80')}>{children}</span>
    </button>
  )
})
