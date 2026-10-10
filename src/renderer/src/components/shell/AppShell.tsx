import { useAppSync } from '@renderer/hooks/use-app-sync'
import { useDownloadNotifications } from '@renderer/hooks/use-download-notifications'
import { COPY } from '@renderer/lib/copy'
import { selectQueueCount, useDownloadStore } from '@renderer/store/download-store'
import { useUiStore } from '@renderer/store/ui-store'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { ErrorBoundary } from './ErrorBoundary'
import { TAB_IDS, type TabId } from './navigation'
import { ScreenSkeleton } from './ScreenSkeleton'
import { TabBar } from './TabBar'
import { TitleBar } from './TitleBar'

const SCREENS = {
  about: lazy(() => import('@renderer/features/about/AboutScreen')),
  downloader: lazy(() => import('@renderer/features/downloader/DownloaderScreen')),
  library: lazy(() => import('@renderer/features/library/LibraryScreen')),
  queue: lazy(() => import('@renderer/features/queue/QueueScreen')),
  settings: lazy(() => import('@renderer/features/settings/SettingsScreen')),
} satisfies Record<TabId, React.LazyExoticComponent<() => React.JSX.Element>>

const UiKitScreen = lazy(() => import('@renderer/features/ui-kit/UiKitScreen'))

export function AppShell(): React.JSX.Element {
  useAppSync()
  useDownloadNotifications()
  const activeTab = useUiStore((state) => state.activeTab)
  const setActiveTab = useUiStore((state) => state.setActiveTab)
  const visited = useUiStore((state) => state.visitedTabs)
  const queueCount = useDownloadStore(selectQueueCount)
  const [showUiKit, setShowUiKit] = useState(false)

  const changeTab = useCallback(
    (tab: TabId): void => {
      setActiveTab(tab)
      setShowUiKit(false)
    },
    [setActiveTab],
  )

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent): void => {
      const modifier = event.metaKey || event.ctrlKey
      if (import.meta.env.DEV && modifier && event.shiftKey && event.key.toLowerCase() === 'u') {
        event.preventDefault()
        setShowUiKit((current) => !current)
        return
      }
      if (event.key === 'Escape' && showUiKit) {
        setShowUiKit(false)
        return
      }
      if (!modifier) return
      const tabIndex = Number(event.key) - 1
      const shortcutTab = TAB_IDS[tabIndex]
      if (shortcutTab) {
        event.preventDefault()
        changeTab(shortcutTab)
      } else if (event.key === ',') {
        event.preventDefault()
        changeTab('settings')
      } else if (event.key.toLowerCase() === 'l') {
        event.preventDefault()
        changeTab('downloader')
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [changeTab, showUiKit])

  return (
    <div
      className="from-canvas-from to-canvas-to flex h-full min-h-0 min-w-[850px] flex-col overflow-hidden bg-gradient-to-b"
      data-testid="app-shell"
    >
      <TitleBar />
      <TabBar activeTab={activeTab} onChange={changeTab} queueCount={queueCount} />
      <main className="@container min-h-0 flex-1 overflow-y-auto p-5">
        {showUiKit ? (
          <Suspense fallback={<ScreenSkeleton />}>
            <UiKitScreen />
          </Suspense>
        ) : (
          TAB_IDS.map((tab) => {
            if (!visited.has(tab)) return null
            const Screen = SCREENS[tab]
            return (
              <section
                aria-labelledby={`tab-${tab}`}
                className="h-full"
                hidden={activeTab !== tab}
                id={`panel-${tab}`}
                key={tab}
                role="tabpanel"
              >
                <ErrorBoundary>
                  <Suspense fallback={<ScreenSkeleton />}>
                    <Screen />
                  </Suspense>
                </ErrorBoundary>
              </section>
            )
          })
        )}
      </main>
      {import.meta.env.DEV ? (
        <div className="text-fg-muted/60 pointer-events-none absolute right-3 bottom-2 text-[9px]">
          {COPY.devUiKit.title}: Ctrl/⌘ Shift U
        </div>
      ) : null}
    </div>
  )
}
