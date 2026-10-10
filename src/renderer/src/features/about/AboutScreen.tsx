import { FoundationScreen } from '@renderer/features/foundation/FoundationScreen'
import { COPY } from '@renderer/lib/copy'

export default function AboutScreen(): React.JSX.Element {
  return <FoundationScreen {...COPY.foundation.about} />
}
