const ALLOWED_HTTPS_HOSTS = new Set(['github.com', 'www.linkedin.com', 'paypal.me'])
const DEVELOPER_EMAIL = 'developer.hussain125@gmail.com'

export function isAllowedExternalUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol === 'mailto:') {
    return url.pathname === DEVELOPER_EMAIL && url.search === '' && url.hash === ''
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false
  if (!ALLOWED_HTTPS_HOSTS.has(url.hostname)) return false
  if (url.hostname === 'github.com' && url.pathname.startsWith('/yt-dlp/yt-dlp/releases')) {
    return true
  }
  return url.hostname !== 'github.com' || url.pathname.startsWith('/hussainislive')
}
