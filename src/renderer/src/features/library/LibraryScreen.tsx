import { FoundationScreen } from '@renderer/features/foundation/FoundationScreen'
import { COPY } from '@renderer/lib/copy'

export default function LibraryScreen(): React.JSX.Element {
  return <FoundationScreen {...COPY.foundation.library} />
}
