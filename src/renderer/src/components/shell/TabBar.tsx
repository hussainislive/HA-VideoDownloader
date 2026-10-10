import { cn } from '@renderer/lib/cn'
import { COPY } from '@renderer/lib/copy'
import { motion, useReducedMotion } from 'motion/react'

import { TAB_CONFIG, type TabId } from './navigation'

interface TabBarProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
  queueCount?: number
}

export function TabBar({ activeTab, onChange, queueCount = 0 }: TabBarProps): React.JSX.Element {
  const reduceMotion = useReducedMotion()
  return (
    <nav
      className="border-line-subtle flex h-12 shrink-0 items-center border-b px-5"
      aria-label={COPY.accessibility.mainNavigation}
    >
      <div
        aria-label={COPY.accessibility.applicationSections}
        className="flex items-center gap-1.5"
        role="tablist"
      >
        {TAB_CONFIG.map(({ id, icon: Icon, label }) => {
          const active = id === activeTab
          return (
            <button
              aria-controls={`panel-${id}`}
              aria-selected={active}
              className={cn(
                'duration-base relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors',
                active
                  ? 'text-accent-on'
                  : 'text-fg-muted hover:bg-surface-elevated hover:text-fg-body',
              )}
              id={`tab-${id}`}
              key={id}
              onClick={() => onChange(id)}
              role="tab"
              type="button"
            >
              {active ? (
                <motion.span
                  className="bg-accent shadow-glow-sm absolute inset-0 rounded-full"
                  layoutId="active-tab"
                  transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
              ) : null}
              <Icon aria-hidden="true" className="relative z-10 size-3.5" strokeWidth={1.8} />
              <span className="relative z-10">{label}</span>
              {id === 'queue' && queueCount > 0 ? (
                <span className="telemetry border-line-strong bg-surface-solid text-accent relative z-10 flex size-4 items-center justify-center rounded-full border text-[9px]">
                  {queueCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
