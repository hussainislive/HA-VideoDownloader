const MAX_URL_LENGTH = 2_048

export function parseHttpUrl(value: string): URL | null {
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_URL_LENGTH) return null
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export function normalizeMediaUrl(value: string): string | null {
  const url = parseHttpUrl(value)
  if (!url) return null
  url.hash = ''
  return url.toString()
}
