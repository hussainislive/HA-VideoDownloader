import type { TabId } from '@renderer/components/shell/navigation'
import { create } from 'zustand'

interface UiStoreState {
  activeTab: TabId
  downloaderFocusRequest: number
  droppedUrl: string | undefined
  acceptDroppedUrl: (url: string) => void
  clearDroppedUrl: () => void
  requestDownloaderFocus: () => void
  setActiveTab: (tab: TabId) => void
  visitedTabs: ReadonlySet<TabId>
}

export const useUiStore = create<UiStoreState>((set) => ({
  activeTab: 'downloader',
  downloaderFocusRequest: 0,
  droppedUrl: undefined,
  visitedTabs: new Set(['downloader']),
  setActiveTab: (activeTab) =>
    set((state) => ({
      activeTab,
      visitedTabs: state.visitedTabs.has(activeTab)
        ? state.visitedTabs
        : new Set([...state.visitedTabs, activeTab]),
    })),
  requestDownloaderFocus: () =>
    set((state) => ({ downloaderFocusRequest: state.downloaderFocusRequest + 1 })),
  acceptDroppedUrl: (droppedUrl) => set({ activeTab: 'downloader', droppedUrl }),
  clearDroppedUrl: () => set({ droppedUrl: undefined }),
}))

export function navigateToTab(tab: TabId): void {
  useUiStore.getState().setActiveTab(tab)
}
