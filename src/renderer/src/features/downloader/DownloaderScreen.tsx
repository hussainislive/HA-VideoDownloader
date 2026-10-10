import { FoundationScreen } from '@renderer/features/foundation/FoundationScreen'
import { COPY } from '@renderer/lib/copy'

export default function DownloaderScreen(): React.JSX.Element {
  return <FoundationScreen {...COPY.foundation.downloader} />
}
