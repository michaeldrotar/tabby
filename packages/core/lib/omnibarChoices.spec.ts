import { describe, expect, it } from 'vitest'
import {
  getOmnibarTarget,
  OMNIBAR_CHOICE_LIMIT,
  readOmnibarChoices,
  rememberOmnibarChoice,
} from './omnibarChoices.js'

const day = 24 * 60 * 60 * 1000

describe('Omnibar choices', () => {
  it('normalizes queries, refreshes each destination, expires old entries and bounds storage', () => {
    const first = {
      query: ' Cat  notes ',
      target: 'window:1',
      selectedAt: 100 * day,
    }
    const next = { query: 'cat notes', target: 'tab:2', selectedAt: 101 * day }
    const both = rememberOmnibarChoice([first], next)
    expect(both).toEqual([next, { ...first, query: 'cat notes' }])
    const refreshed = { ...first, query: 'cat notes', selectedAt: 102 * day }
    expect(rememberOmnibarChoice(both, refreshed)).toEqual([refreshed, next])
    const choices = Array.from({ length: 300 }, (_, i) => ({
      query: 'cat notes',
      target: `tab:${i}`,
      selectedAt: 100 * day + i,
    }))
    expect(readOmnibarChoices(choices, 101 * day)).toHaveLength(
      OMNIBAR_CHOICE_LIMIT,
    )
    expect(
      readOmnibarChoices(
        [
          first,
          null,
          { ...first, selectedAt: Infinity },
          { ...first, selectedAt: 200 * day },
        ],
        191 * day,
      ),
    ).toEqual([])
    expect(readOmnibarChoices({}, 101 * day)).toEqual([])
  })

  it('ignores web searches without replacing a remembered destination', () => {
    const remembered = { query: 'cat', target: 'tab:2', selectedAt: day }
    const search = {
      query: 'cat',
      target: 'search:google',
      selectedAt: 2 * day,
    }
    expect(rememberOmnibarChoice([remembered], search)).toEqual([remembered])
    expect(readOmnibarChoices([search], 2 * day)).toEqual([])
  })

  it('identifies destinations independently of names, window numbers and URL result sources', () => {
    expect(
      getOmnibarTarget({
        type: 'window',
        action: { kind: 'window', windowId: 42 },
      }),
    ).toBe('window:42')
    const action = {
      kind: 'url' as const,
      url: 'https://example.com/cat#notes',
    }
    expect(getOmnibarTarget({ type: 'bookmark', action })).toBe(
      getOmnibarTarget({ type: 'history', action }),
    )
    expect(getOmnibarTarget({ type: 'command', action })).not.toBe(
      getOmnibarTarget({ type: 'history', action }),
    )
  })
})
