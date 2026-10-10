import { isAllowedExternalUrl } from '@main/security/external-url'
import { describe, expect, it } from 'vitest'

describe('external URL allowlist', () => {
  it.each([
    'https://github.com/hussainislive',
    'https://github.com/hussainislive/HA-VideoDownloader',
    'https://github.com/yt-dlp/yt-dlp/releases',
    'https://www.linkedin.com/in/hussainislive/',
    'https://paypal.me/hussainmeer',
    'mailto:developer.hussain125@gmail.com',
  ])('allows %s', (url) => {
    expect(isAllowedExternalUrl(url)).toBe(true)
  })

  it.each([
    'https://example.com',
    'http://github.com/hussainislive',
    'https://github.com/unapproved',
    'mailto:someone@example.com',
    'javascript:alert(1)',
    'not-a-url',
  ])('blocks %s', (url) => {
    expect(isAllowedExternalUrl(url)).toBe(false)
  })
})
