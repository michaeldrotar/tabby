import { describe, expect, it } from 'vitest'
import { compareOmnibarScoredItems } from './omnibarRanking.js'
import type { OmnibarRankableResult } from './omnibarRanking.js'

const item = (
  id: string,
  title: string,
  lastVisitTime?: number,
): OmnibarRankableResult => ({ id, title, lastVisitTime, type: 'tab' })

describe('Omnibar score ordering', () => {
  it('orders equal scores by stable identity regardless of live titles or browsing activity', () => {
    const results = [
      { item: item('2', 'Beta', 100), score: 50 },
      { item: item('3', 'Alpha'), score: 50 },
      { item: item('1', 'Alpha'), score: 50 },
      { item: item('4', 'Zulu'), score: 60 },
    ].sort(compareOmnibarScoredItems)
    expect(results.map((result) => result.item.id)).toEqual([
      '4',
      '1',
      '2',
      '3',
    ])
  })
  it('keeps equal-score results in place when unread counts change', () => {
    const results = [
      { item: item('2', 'Inbox (9)'), score: 50 },
      { item: item('1', 'Inbox (10)'), score: 50 },
    ]
    const order = () =>
      [...results].sort(compareOmnibarScoredItems).map(({ item }) => item.id)
    const initial = order()
    results[0]!.item.title = 'Inbox (11)'
    results[1]!.item.title = 'Inbox (9)'
    expect(order()).toEqual(initial)
  })
})
