import { COPY } from '@renderer/lib/copy'
import { LoaderCircle } from 'lucide-react'

interface SpinnerProps {
  label?: string
}

export function Spinner({ label = COPY.accessibility.loading }: SpinnerProps): React.JSX.Element {
  return (
    <span
      aria-label={label}
      className="text-accent inline-flex items-center justify-center"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
    </span>
  )
}
