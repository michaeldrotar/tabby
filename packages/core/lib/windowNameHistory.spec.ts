import { describe, expect, it } from 'vitest'
import { readWindowNameHistory } from './windowNameHistory'

describe('window name history', () => {
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
