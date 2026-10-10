import { COPY } from '@renderer/lib/copy'
import { Download, FolderClock, Info, ListChecks, Settings } from 'lucide-react'

export type TabId = keyof typeof COPY.tabs

export const TAB_IDS: readonly TabId[] = ['downloader', 'queue', 'library', 'settings', 'about']

export const TAB_CONFIG = [
  { id: 'downloader', icon: Download, label: COPY.tabs.downloader },
  { id: 'queue', icon: ListChecks, label: COPY.tabs.queue },
  { id: 'library', icon: FolderClock, label: COPY.tabs.library },
  { id: 'settings', icon: Settings, label: COPY.tabs.settings },
  { id: 'about', icon: Info, label: COPY.tabs.about },
] as const
