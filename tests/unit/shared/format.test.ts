import { formatBytes, formatDuration, formatSpeed } from '@shared/utils/format'
import { describe, expect, it } from 'vitest'

describe('format helpers', () => {
  it('formats byte counts with stable binary units', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1_536)).toBe('1.50 KB')
    expect(formatBytes(10 * 1024 * 1024)).toBe('10.0 MB')
    expect(formatBytes(Number.NaN)).toBe('0 B')
  })

  it('formats short and long durations', () => {
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(3_661)).toBe('1:01:01')
    expect(formatDuration(-1)).toBe('00:00')
  })

  it('formats transfer speed using the byte formatter', () => {
    expect(formatSpeed(1_536)).toBe('1.50 KB/s')
  })
})
