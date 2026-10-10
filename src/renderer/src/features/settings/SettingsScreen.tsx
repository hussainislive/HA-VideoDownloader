import { FoundationScreen } from '@renderer/features/foundation/FoundationScreen'
import { COPY } from '@renderer/lib/copy'

export default function SettingsScreen(): React.JSX.Element {
  return <FoundationScreen {...COPY.foundation.settings} />
}
