const URL_TOKEN = /https?:\/\/[^\s<>"']+/iu

export function firstHttpUrl(text: string): string | undefined {
  const match = text.match(URL_TOKEN)?.[0]
  if (!match) return undefined
  try {
    const url = new URL(match)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}
