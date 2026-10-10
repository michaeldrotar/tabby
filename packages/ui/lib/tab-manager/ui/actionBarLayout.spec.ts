import { describe, expect, it } from 'vitest'
import { formatSelectionCount } from './actionBarLayout'

describe('actionBarLayout', () => {
  it('caps count labels at a fixed 100+ value', () => {
    expect(formatSelectionCount(0)).toBe('0')
    expect(formatSelectionCount(1)).toBe('1')
    expect(formatSelectionCount(99)).toBe('99')
    expect(formatSelectionCount(100)).toBe('100+')
    expect(formatSelectionCount(10_000)).toBe('100+')
  })
})
