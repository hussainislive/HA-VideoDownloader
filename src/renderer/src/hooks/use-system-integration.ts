import { useToast } from '@renderer/components/ui/Toast'
import { navigateToTab } from '@renderer/store/ui-store'
import { useEffect } from 'react'

export function useSystemIntegration(): void {
  const { showToast } = useToast()

  useEffect(() => {
    const unsubscribe = window.api.system.onNavigate((target) => navigateToTab(target))
    void window.api.system.getStartupNotices().then((result) => {
      if (!result.ok) return
      for (const notice of result.value) showToast(notice)
      if (result.value.some((notice) => notice.includes('download folder'))) {
        navigateToTab('settings')
      }
    })
    return unsubscribe
  }, [showToast])
}
