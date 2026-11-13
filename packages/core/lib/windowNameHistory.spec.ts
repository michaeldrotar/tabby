import { describe, expect, it } from 'vitest'
import { forgetWindowName, readWindowNameHistory } from './windowNameHistory'

describe('window name history', () => {
  it('forgets a name regardless of spelling without affecting other names', () => {
    expect(forgetWindowName(['Work', 'Research'], ' work ')).toEqual([
      'Research',
    ])
  })
  it('normalizes names and preserves the most recent spelling of each name', () => {
    expect(
      readWindowNameHistory([' Work ', '', null, 'work', 'Research']),
    ).toEqual(['Work', 'Research'])
    expect(readWindowNameHistory(null)).toEqual([])
    expect(
      readWindowNameHistory(Array.from({ length: 60 }, (_, i) => `Name ${i}`)),
    ).toHaveLength(50)
  })
})
