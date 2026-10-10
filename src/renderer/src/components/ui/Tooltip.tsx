import type { ReactElement } from 'react'

interface TooltipProps {
  children: ReactElement
  content: string
}

export function Tooltip({ children, content }: TooltipProps): React.JSX.Element {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className="border-line bg-surface-overlay text-fg-body shadow-card pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 translate-y-1 rounded-lg border px-2 py-1 text-[10px] whitespace-nowrap opacity-0 transition-[transform,opacity] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}
