import { describe, expect, it } from 'vitest'
import { compareOmnibarScoredItems } from './omnibarRanking.js'
import type { OmnibarRankableResult } from './omnibarRanking.js'

const item = (
  id: string,
  title: string,
  lastVisitTime?: number,
): OmnibarRankableResult => ({ id, title, lastVisitTime, type: 'tab' })

describe('Omnibar score ordering', () => {
  it('orders by score then title and stable identity, regardless of browsing activity', () => {
    const results = [
      { item: item('2', 'Beta', 100), score: 50 },
      { item: item('3', 'Alpha'), score: 50 },
      { item: item('1', 'Alpha'), score: 50 },
      { item: item('4', 'Zulu'), score: 60 },
    ].sort(compareOmnibarScoredItems)
    expect(results.map((result) => result.item.id)).toEqual([
      '4',
      '1',
      '3',
      '2',
    ])
  })
})
