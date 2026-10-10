import type { DownloadProgress } from '@shared/types/download'

function numberOrUndefined(value: string | undefined): number | undefined {
  if (!value || value === 'NA' || value === 'None') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseProgressLine(line: string): DownloadProgress | undefined {
  if (!line.startsWith('HA|')) return undefined
  const [, status, downloadedRaw, totalRaw, estimateRaw, speedRaw, etaRaw] = line.split('|')
  const downloadedBytes = numberOrUndefined(downloadedRaw)
  const totalBytes = numberOrUndefined(totalRaw) ?? numberOrUndefined(estimateRaw)
  const percent =
    downloadedBytes !== undefined && totalBytes !== undefined && totalBytes > 0
      ? Math.min(100, (downloadedBytes / totalBytes) * 100)
      : undefined
  return {
    phase: status === 'finished' ? 'finalizing' : 'downloading',
    ...(downloadedBytes !== undefined ? { downloadedBytes } : {}),
    ...(totalBytes !== undefined ? { totalBytes } : {}),
    ...(numberOrUndefined(speedRaw) !== undefined ? { speedBps: numberOrUndefined(speedRaw) } : {}),
    ...(numberOrUndefined(etaRaw) !== undefined ? { etaSec: numberOrUndefined(etaRaw) } : {}),
    ...(percent !== undefined ? { percent } : {}),
  }
}

export function phaseFromOutput(line: string): DownloadProgress['phase'] | undefined {
  if (/merg(?:e|ing)|\[merger\]/iu.test(line)) return 'merging'
  if (/extractaudio|converting|destination:.*\.(?:mp3|m4a|wav)$/iu.test(line)) return 'converting'
  if (/deleting original file|fixup|metadata|embedthumbnail/iu.test(line)) return 'finalizing'
  return undefined
}

export class ProgressAccumulator {
  #lastPercent = 0
  #completedBytes = 0
  #completedTotal = 0
  #lastStreamBytes = 0
  #lastStreamTotal = 0

  update(next: DownloadProgress): DownloadProgress {
    const downloaded = next.downloadedBytes ?? 0
    if (downloaded < this.#lastStreamBytes) {
      this.#completedBytes += this.#lastStreamBytes
      this.#completedTotal += this.#lastStreamTotal
    }
    this.#lastStreamBytes = downloaded
    this.#lastStreamTotal = next.totalBytes ?? this.#lastStreamTotal
    const aggregateDownloaded = this.#completedBytes + downloaded
    const aggregateTotal = this.#completedTotal + (next.totalBytes ?? 0)
    const aggregatePercent = aggregateTotal > 0 ? (aggregateDownloaded / aggregateTotal) * 100 : 0
    const percent = Math.max(this.#lastPercent, next.percent ?? aggregatePercent, aggregatePercent)
    this.#lastPercent = percent
    return {
      ...next,
      ...(next.downloadedBytes !== undefined ? { downloadedBytes: aggregateDownloaded } : {}),
      ...(next.totalBytes !== undefined ? { totalBytes: aggregateTotal } : {}),
      ...(next.percent !== undefined || aggregateTotal > 0 ? { percent } : {}),
    }
  }
}
