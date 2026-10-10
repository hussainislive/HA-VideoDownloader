import { FoundationScreen } from '@renderer/features/foundation/FoundationScreen'
import { COPY } from '@renderer/lib/copy'

export default function QueueScreen(): React.JSX.Element {
  return <FoundationScreen {...COPY.foundation.queue} />
}
