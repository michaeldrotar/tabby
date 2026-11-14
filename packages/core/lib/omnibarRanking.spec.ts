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
  it('uses type preference for equal matches when recency is equal', () => {
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
    expect(rankOmnibarResults([items[1]!, recent], 'cat', day)[0]?.id).toBe(
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
    'promotes a successful $type choice for normalized queries and word prefixes',
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
      ).toEqual([
        item.id,
        ...['command', 'window', 'group', 'tab'].filter((id) => id !== item.id),
      ])
      expect(rankOmnibarResults(items, 'cat', 70 * day, choices)[0]?.id).toBe(
        'command',
      )
    },
  )

  it('prefers open items over ordinary history but allows an explicit recent choice to win', () => {
    const results: OmnibarResult[] = [
      { ...items[0]!, title: 'Old mail', url: 'https://gmail.test/inbox' },
      ...(['bookmark', 'recently-closed', 'history'] as const).map((type) => ({
        id: type,
        type,
        title: 'Inbox',
        lastVisitTime: type === 'bookmark' ? undefined : day,
        action: { kind: 'url' as const, url: `https://${type}.test` },
      })),
    ]
    expect(order(rankOmnibarResults(results, 'inbox', day))).toEqual([
      'tab',
      'bookmark',
      'recently-closed',
      'history',
    ])
    const history = results.find((item) => item.type === 'history')!
    const choices = [
      {
        query: 'inbox gmail',
        target: getOmnibarTarget(history),
        selectedAt: day,
      },
    ]
    expect(
      order(rankOmnibarResults(results.reverse(), 'inbox', day, choices)),
    ).toEqual(['history', 'tab', 'bookmark', 'recently-closed'])
  })

  it('uses text relevance to distinguish matches within the same type', () => {
    const results: OmnibarResult[] = [
      { ...items[3]!, id: 'complete', title: 'Manager' },
      {
        ...items[3]!,
        title: 'Chrome: Password manager',
        searchTitle: 'Password manager',
      },
    ]
    expect(order(rankOmnibarResults(results, 'manager', 0))).toEqual([
      'complete',
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
