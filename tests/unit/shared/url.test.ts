import { normalizeMediaUrl, parseHttpUrl } from '@shared/utils/url'
import { describe, expect, it } from 'vitest'

describe('URL helpers', () => {
  it('accepts only http and https links', () => {
    expect(parseHttpUrl('https://example.com/video')?.hostname).toBe('example.com')
    expect(parseHttpUrl('http://example.com')).not.toBeNull()
    expect(parseHttpUrl('file:///tmp/video')).toBeNull()
    expect(parseHttpUrl('not a link')).toBeNull()
  })

  it('normalizes whitespace and removes fragments', () => {
    expect(normalizeMediaUrl(' https://example.com/watch?v=1#player ')).toBe(
      'https://example.com/watch?v=1',
    )
  })

  it('rejects links over the boundary length', () => {
    expect(parseHttpUrl(`https://example.com/${'a'.repeat(2_100)}`)).toBeNull()
  })
})
