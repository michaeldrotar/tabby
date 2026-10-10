import { describe, expect, it } from 'vitest'
import { createTranslator } from './translator.js'

describe('browser-independent translations', () => {
  it('substitutes named and numbered placeholders without interpreting literal dollars', () => {
    const { t } = createTranslator({
      title: {
        message: '$LABEL$: $2, $$1, $$$1',
        placeholders: { label: { content: '$1' } },
      },
    })
    expect(t('title', ['Tabs', 'Windows'])).toBe('Tabs: Windows, $1, $Tabs')
    expect(t('missing')).toBe('')
  })
  it('supports plural rules and independent catalogs on one page', () => {
    const first = createTranslator({
      tabs_one: { message: '$1 tab' },
      tabs_other: { message: '$1 tabs' },
    })
    const second = createTranslator({
      tabs_one: { message: '$1 item' },
      tabs_other: { message: '$1 items' },
    })
    expect(first.tt('tabs', 1)).toBe('1 tab')
    expect(first.tt('tabs', 3)).toBe('3 tabs')
    expect(second.tt('tabs', 3)).toBe('3 items')
  })
})
