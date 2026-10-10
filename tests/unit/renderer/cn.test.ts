import { cn } from '@renderer/lib/cn'
import { describe, expect, it } from 'vitest'

describe('cn', () => {
  it('combines conditional classes and resolves Tailwind conflicts', () => {
    const hidden = false
    expect(cn('px-2 text-xs', hidden && 'hidden', 'px-4')).toBe('text-xs px-4')
  })
})
