import { Badge } from '@renderer/components/ui/Badge'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import { Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const SKELETON_CARDS = ['primary', 'secondary', 'tertiary'] as const

interface FoundationScreenProps {
  description: string
  title: string
}

export function FoundationScreen({ description, title }: FoundationScreenProps): React.JSX.Element {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-4"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative flex min-h-44 flex-1 overflow-hidden p-5">
        <div className="relative z-10 flex max-w-md flex-col justify-between">
          <div>
            <Badge tone="accent">{COPY.foundation.badge}</Badge>
            <h1 className="text-fg-heading mt-3 text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-fg-muted mt-1.5 text-[13px] leading-5">{description}</p>
          </div>
          <div className="text-fg-body mt-6 flex items-center gap-2 text-[11px] font-medium">
            <Sparkles aria-hidden="true" className="text-accent size-4" />
            {COPY.foundation.ready}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-y-5 right-5 hidden w-[38%] grid-cols-2 gap-3 @min-[700px]:grid"
        >
          <span className="skeleton-shimmer border-line bg-surface-solid rounded-2xl border" />
          <span className="skeleton-shimmer border-line bg-surface-elevated rounded-2xl border" />
          <span className="skeleton-shimmer border-line bg-surface-solid col-span-2 rounded-2xl border" />
        </div>
      </Card>
      <div className="grid h-36 grid-cols-3 gap-3">
        {SKELETON_CARDS.map((item) => (
          <Card aria-hidden="true" className="p-4" key={item} variant="solid">
            <span className="bg-accent-soft mb-4 block h-2 w-16 rounded-full" />
            <span className="bg-surface-elevated mb-2 block h-2 w-full rounded-full" />
            <span className="bg-surface-elevated block h-2 w-2/3 rounded-full" />
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
