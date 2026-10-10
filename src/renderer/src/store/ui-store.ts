import type { TabId } from '@renderer/components/shell/navigation'
import { create } from 'zustand'

interface UiStoreState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  visitedTabs: ReadonlySet<TabId>
}

export const useUiStore = create<UiStoreState>((set) => ({
  activeTab: 'downloader',
  visitedTabs: new Set(['downloader']),
  setActiveTab: (activeTab) =>
    set((state) => ({
      activeTab,
      visitedTabs: state.visitedTabs.has(activeTab)
        ? state.visitedTabs
        : new Set([...state.visitedTabs, activeTab]),
    })),
}))

export function navigateToTab(tab: TabId): void {
  useUiStore.getState().setActiveTab(tab)
}
