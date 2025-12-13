import { getOmnibarTypeColor } from './getOmnibarTypeColor'
import { describe, expect, it } from 'vitest'

describe('getOmnibarTypeColor', () => {
  it('returns fixed colors per type', () => {
    expect(getOmnibarTypeColor('tab')).toContain('text-blue')
    expect(getOmnibarTypeColor('bookmark')).toContain('text-yellow')
    expect(getOmnibarTypeColor('history')).toContain('text-teal')
    expect(getOmnibarTypeColor('command')).toContain('text-purple')
    expect(getOmnibarTypeColor('url')).toContain('text-green')
    expect(getOmnibarTypeColor('search')).toContain('text-indigo')
    expect(getOmnibarTypeColor('recently-closed')).toContain('text-orange')
  })

  it('falls back to neutral gray', () => {
    // @ts-expect-error - intentionally verifying fallback behavior
    expect(getOmnibarTypeColor('unknown')).toContain('text-gray')
  })
})
