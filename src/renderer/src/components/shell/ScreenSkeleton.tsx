import { COPY } from '@renderer/lib/copy'

export function ScreenSkeleton(): React.JSX.Element {
  return (
    <div
      aria-label={COPY.accessibility.loadingScreen}
      className="mx-auto grid h-full w-full max-w-[1200px] grid-cols-3 gap-3"
      role="status"
    >
      <span className="skeleton-shimmer border-line bg-surface-solid col-span-2 rounded-2xl border" />
      <span className="skeleton-shimmer border-line bg-surface-elevated rounded-2xl border" />
      <span className="skeleton-shimmer border-line bg-surface-solid col-span-3 h-32 rounded-2xl border" />
    </div>
  )
}
