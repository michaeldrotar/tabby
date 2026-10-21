import { describe, expect, it } from 'vitest'
import { getOmnibarTarget, rememberOmnibarChoice } from './omnibarChoices.js'
import { calculateScore, rankOmnibarResults } from './omnibarRanking.js'
import type { OmnibarResult } from './omnibar.js'

const items: OmnibarResult[] = [
  {
    id: 'tab',
    type: 'tab',
    title: 'Cat',
    action: { kind: 'tab', tabId: 1, windowId: 1 },
  },
  {
    id: 'group',
    type: 'tab-group',
    title: 'Cat',
    action: { kind: 'group', groupId: 1 },
  },
  {
    id: 'window',
    type: 'window',
    title: 'Cat',
    action: { kind: 'window', windowId: 1 },
  },
  { id: 'command', type: 'command', title: 'Cat', action: { kind: 'options' } },
]
const day = 24 * 60 * 60 * 1000
const order = (results: OmnibarResult[]) => results.map((item) => item.id)

describe('Omnibar ranking', () => {
  it('uses category preference for equal matches when recency is equal', () => {
    expect(
      order(
        rankOmnibarResults(
          items.map((item) => ({
            ...item,
            lastVisitTime: 1000,
          })),
          'cat',
          1000,
        ),
      ),
    ).toEqual(['command', 'window', 'group', 'tab'])
  })

  it('boosts recently visited matches and fades browsing recency daily', () => {
    const recent = { ...items[0]!, lastVisitTime: day }
    expect(rankOmnibarResults([items[3]!, recent], 'cat', day)[0]?.id).toBe(
      'tab',
    )
    expect(
      calculateScore(recent, 'cat', day) -
        calculateScore(items[0]!, 'cat', day),
    ).toBe(20)
    expect(
      calculateScore(recent, 'cat', 2 * day) -
        calculateScore(items[0]!, 'cat', 2 * day),
    ).toBe(10)
    expect(
      calculateScore({ ...recent, lastVisitTime: Infinity }, 'cat', day),
    ).toBe(calculateScore(items[0]!, 'cat', day))
  })

  it.each(items)(
    'promotes a successful $type choice only for the same normalized query',
    (item) => {
      const choices = rememberOmnibarChoice([], {
        query: '  CAT  ',
        target: getOmnibarTarget(item),
        selectedAt: day,
      })
      expect(rankOmnibarResults(items, 'cat', day + 1000, choices)[0]?.id).toBe(
        item.id,
      )
      expect(
        order(rankOmnibarResults(items, 'ca', day + 1000, choices)),
      ).toEqual(['command', 'window', 'group', 'tab'])
      expect(rankOmnibarResults(items, 'cat', 70 * day, choices)[0]?.id).toBe(
        'command',
      )
    },
  )

  it('lets complete names outrank a command with a weaker title match', () => {
    const results: OmnibarResult[] = [
      { ...items[2]!, title: 'Manager' },
      {
        ...items[3]!,
        title: 'Chrome: Password manager',
        searchTitle: 'Password manager',
      },
    ]
    expect(order(rankOmnibarResults(results, 'manager', 0))).toEqual([
      'window',
      'command',
    ])
    expect(
      calculateScore({ ...items[0]!, title: 'Cat notes' }, 'cat', 0),
    ).toBeLessThan(calculateScore(items[2]!, 'cat', 0))
  })

  it('orders supplied candidates without filtering them and treats repeated words once', () => {
    expect(rankOmnibarResults(items, 'cat missing', 0)).toHaveLength(
      items.length,
    )
    const item = { ...items[0]!, title: 'Cat notes' }
    expect(calculateScore(item, 'cat cat', 0)).toBe(
      calculateScore(item, 'cat', 0),
    )
  })
})
