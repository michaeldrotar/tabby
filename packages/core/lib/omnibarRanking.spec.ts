import { describe, expect, it } from 'vitest'
import { calculateScore } from './omnibarRanking.js'
import type { OmnibarRankableResult } from './omnibarRanking.js'

const makeItem = (
  overrides: Partial<OmnibarRankableResult>,
): OmnibarRankableResult => ({
  id: 'id',
  type: 'history',
  title: 'Title',
  ...overrides,
})

describe('calculateScore', () => {
  it('prioritizes much more recent items over slightly better textual matches', () => {
    const now = Date.UTC(2025, 11, 15, 12)

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

    expect(calculateScore(newerWorseMatch, query, now)).toBeGreaterThan(
      calculateScore(olderBetterMatch, query, now),
    )
  })

  it('applies a true half-life to the recency bonus', () => {
    const now = Date.UTC(2025, 11, 15, 12)

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
      now,
    )
    const scoreNow = calculateScore(
      { ...baseItem, lastVisitTime: now },
      'gmail',
      now,
    )
    const scoreHalfLife = calculateScore(
      { ...baseItem, lastVisitTime: now - halfLifeMs },
      'gmail',
      now,
    )

    const bonusNow = scoreNow - scoreNoRecency
    const bonusHalfLife = scoreHalfLife - scoreNoRecency

    expect(bonusHalfLife).toBeCloseTo(bonusNow / 2, 6)
  })

  it('does not over-weight repeated query terms (dedupes tokens)', () => {
    const now = Date.UTC(2025, 11, 15, 12)
    const item = makeItem({
      id: 'x',
      type: 'history',
      title: 'gmail inbox',
      url: 'https://mail.google.com/mail/u/0/#inbox',
      lastVisitTime: now - 60_000,
    })

    expect(calculateScore(item, 'gmail gmail', now)).toBeCloseTo(
      calculateScore(item, 'gmail', now),
      6,
    )
  })
})
