import { AppShell } from '@renderer/components/shell/AppShell'
import { ToastProvider } from '@renderer/components/ui/Toast'

export function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  )
}
