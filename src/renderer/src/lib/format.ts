export function formatBytes(bytes?: number): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1_000 && unit < units.length - 1) {
    value /= 1_000
    unit += 1
  }
  return `${value >= 100 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`
}

export function formatDuration(seconds?: number): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return '—'
  const whole = Math.max(0, Math.round(seconds))
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const remaining = whole % 60
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`
    : `${minutes}:${remaining.toString().padStart(2, '0')}`
}

export function formatSpeed(bytesPerSecond?: number): string {
  return bytesPerSecond === undefined ? '—' : `${formatBytes(bytesPerSecond)}/s`
}

export function formatEta(seconds?: number): string {
  if (seconds === undefined) return 'Calculating…'
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} sec left`
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return `${minutes} min ${remainder} sec left`
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

export function formatDate(value?: string): string | undefined {
  if (!value) return undefined
  const parsed = /^\d{8}$/.test(value)
    ? new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00`)
    : new Date(value)
  return Number.isNaN(parsed.getTime())
    ? undefined
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed)
}

export function formatTime(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? undefined
    : new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}
