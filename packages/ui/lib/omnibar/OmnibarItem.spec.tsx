// @vitest-environment jsdom
import { OmnibarItem } from './OmnibarItem'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

describe('OmnibarItem', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('does not call scrollIntoView when disableScrollIntoView is true', () => {
    const item: OmnibarSearchResult = {
      id: 'tab-1',
      type: 'tab',
      title: 'Example',
      url: 'https://example.com',
      lastVisitTime: Date.now(),
      execute: async () => {},
    }

    render(
      <ul>
        <OmnibarItem
          item={item}
          isSelected
          disableScrollIntoView
          onSelect={() => {}}
          onMouseMove={() => {}}
          isShiftPressed={false}
          isCmdCtrlPressed={false}
          query="example"
        />
      </ul>,
    )

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
