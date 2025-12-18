import { compareOmnibarScoredItems } from './compareOmnibarScoredItems'
import { describe, expect, it } from 'vitest'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

const makeItem = (
  overrides: Partial<OmnibarSearchResult>,
): OmnibarSearchResult => ({
  id: 'id',
  type: 'history',
  title: 'Title',
  execute: async () => {},
  ...overrides,
})

describe('compareOmnibarScoredItems', () => {
  it('orders by score desc first', () => {
    const older = makeItem({ id: 'older', lastVisitTime: 10 })
    const newer = makeItem({ id: 'newer', lastVisitTime: 20 })

    const sorted = [
      { item: newer, score: 10 },
      { item: older, score: 20 },
    ].sort(compareOmnibarScoredItems)

    expect(sorted.map((s) => s.item.id)).toEqual(['older', 'newer'])
  })

  it('breaks score ties by lastVisitTime (more recent first)', () => {
    const now = 1_700_000_000_000
    const justNow = makeItem({ id: 'just-now', lastVisitTime: now })
    const oneMinuteAgo = makeItem({ id: '1m', lastVisitTime: now - 60_000 })

    const sorted = [
      { item: oneMinuteAgo, score: 50 },
      { item: justNow, score: 50 },
    ].sort(compareOmnibarScoredItems)

    expect(sorted.map((s) => s.item.id)).toEqual(['just-now', '1m'])
  })

  it('puts items without lastVisitTime after items with lastVisitTime when scores tie', () => {
    const withTime = makeItem({ id: 'with-time', lastVisitTime: 123 })
    const withoutTime = makeItem({
      id: 'without-time',
      lastVisitTime: undefined,
    })

    const sorted = [
      { item: withoutTime, score: 50 },
      { item: withTime, score: 50 },
    ].sort(compareOmnibarScoredItems)

    expect(sorted.map((s) => s.item.id)).toEqual(['with-time', 'without-time'])
  })
})
