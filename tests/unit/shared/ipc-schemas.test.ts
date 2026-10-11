import {
  EmptyInputSchema,
  OpenExternalInputSchema,
  PathInputSchema,
  TextInputSchema,
} from '@shared/ipc/schemas'
import { describe, expect, it } from 'vitest'

describe('IPC schemas', () => {
  it('accepts the narrow external-link payload', () => {
    expect(
      OpenExternalInputSchema.safeParse({ url: 'https://github.com/hussainislive' }).success,
    ).toBe(true)
  })

  it('rejects missing, extra, and oversized values at the boundary', () => {
    expect(OpenExternalInputSchema.safeParse({}).success).toBe(false)
    expect(OpenExternalInputSchema.safeParse({ url: 'x'.repeat(2_049) }).success).toBe(false)
    expect(EmptyInputSchema.safeParse({}).success).toBe(false)
  })

  it('bounds clipboard text and disk paths', () => {
    expect(TextInputSchema.safeParse({ text: 'https://example.test' }).success).toBe(true)
    expect(TextInputSchema.safeParse({ text: 'x'.repeat(4_097) }).success).toBe(false)
    expect(PathInputSchema.safeParse({ path: '/tmp/downloads' }).success).toBe(true)
  })
})
