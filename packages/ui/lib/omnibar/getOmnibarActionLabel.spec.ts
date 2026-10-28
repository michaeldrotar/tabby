import { expect, it } from 'vitest'
import { getOmnibarActionLabel } from './getOmnibarActionLabel'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

it('distinguishes restoring a whole closed window from a closed tab regardless of modifiers', () => {
  const tab: OmnibarSearchResult = {
    id: 'closed',
    title: 'Closed page',
    type: 'recently-closed',
    execute: async () => {},
  }
  expect(getOmnibarActionLabel(tab)).toBe('Restore')
  expect(getOmnibarActionLabel({ ...tab, tabCount: 2 }, 'new-tab')).toBe(
    'Restore entire window',
  )
})
