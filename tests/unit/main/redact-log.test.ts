import { homedir } from 'node:os'

import { redactLogValue } from '@main/security/redact-log'
import { describe, expect, it } from 'vitest'

describe('log redaction', () => {
  it('removes URL queries from nested strings and Error details', () => {
    const input: { failure: Error; home: string; self?: unknown; url: string } = {
      url: 'https://example.test/video?token=private',
      failure: new Error('Failed https://example.test/watch?id=secret'),
      home: `${homedir()}/Downloads/media.mp4`,
    }
    input.self = input
    const result = redactLogValue(input)

    expect(JSON.stringify(result)).toContain('[redacted-url]')
    expect(JSON.stringify(result)).not.toContain('private')
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(JSON.stringify(result)).not.toContain(homedir())
    expect(JSON.stringify(result)).toContain('[circular]')
  })
})
