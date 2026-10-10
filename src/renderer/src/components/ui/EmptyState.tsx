import type { LucideIcon } from 'lucide-react'

import { Button } from './Button'
import { Card } from './Card'

interface EmptyStateProps {
  actionLabel?: string
  description: string
  icon: LucideIcon
  onAction?: () => void
  title: string
}

export function EmptyState({
  actionLabel,
  description,
  icon: Icon,
  onAction,
  title,
}: EmptyStateProps): React.JSX.Element {
  return (
    <Card
      className="flex min-h-48 flex-col items-center justify-center p-8 text-center"
      variant="solid"
    >
      <span className="border-line bg-accent-soft text-accent mb-3 flex size-14 items-center justify-center rounded-2xl border">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-fg-heading text-base font-bold">{title}</h2>
      <p className="text-fg-muted mt-1 max-w-sm text-xs leading-5">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-4" onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  )
}
