import { calculateScore } from './scoring'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

afterEach(() => {
  vi.useRealTimers()
})

describe('calculateScore', () => {
  it('prioritizes much more recent items over slightly better textual matches', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-15T12:00:00.000Z'))

    const now = Date.now()

    // Slightly better match (startsWith => 1.2) but very old.
    const olderBetterMatch = makeItem({
      id: 'older',
      type: 'tab',
      title: 'gmail-declutter-extension',
      lastVisitTime: now - 30 * 24 * 60 * 60 * 1000,
    })

    // Slightly worse match (word-start => 1.1) but much more recent.
    const newerWorseMatch = makeItem({
      id: 'newer',
      type: 'tab',
      title: 'inbox gmail',
      lastVisitTime: now - 2 * 24 * 60 * 60 * 1000,
    })

    const query = 'gmail'

    expect(calculateScore(newerWorseMatch, query)).toBeGreaterThan(
      calculateScore(olderBetterMatch, query),
    )
  })

  it('applies a true half-life to the recency bonus', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-15T12:00:00.000Z'))

    const now = Date.now()

    // Keep match/type identical; only vary age.
    const baseItem = makeItem({
      id: 'base',
      type: 'history',
      title: 'gmail inbox',
      url: 'https://mail.google.com',
    })

    const halfLifeMs = 1 * 24 * 60 * 60 * 1000

    const scoreNoRecency = calculateScore(
      { ...baseItem, lastVisitTime: undefined },
      'gmail',
    )
    const scoreNow = calculateScore(
      { ...baseItem, lastVisitTime: now },
      'gmail',
    )
    const scoreHalfLife = calculateScore(
      { ...baseItem, lastVisitTime: now - halfLifeMs },
      'gmail',
    )

    const bonusNow = scoreNow - scoreNoRecency
    const bonusHalfLife = scoreHalfLife - scoreNoRecency

    expect(bonusHalfLife).toBeCloseTo(bonusNow / 2, 6)
  })

  it('does not over-weight repeated query terms (dedupes tokens)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-15T12:00:00.000Z'))

    const now = Date.now()
    const item = makeItem({
      id: 'x',
      type: 'history',
      title: 'gmail inbox',
      url: 'https://mail.google.com/mail/u/0/#inbox',
      lastVisitTime: now - 60_000,
    })

    expect(calculateScore(item, 'gmail gmail')).toBeCloseTo(
      calculateScore(item, 'gmail'),
      6,
    )
  })
})
