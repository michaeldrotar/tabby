import { describe, expect, it } from 'vitest'
import { getWindowIdentificationTab } from './window-identification.js'

const tabs = [
  { id: 2, index: 1, active: true },
  { id: 1, index: 0, active: false },
]

describe('getWindowIdentificationTab', () => {
  it('uses the active tab or earliest tab according to the selected mode', () => {
    expect(getWindowIdentificationTab(tabs, 'active')?.id).toBe(2)
    expect(getWindowIdentificationTab(tabs, 'first')?.id).toBe(1)
  })

  it('falls back to the earliest tab when the active tab is unavailable', () => {
    expect(
      getWindowIdentificationTab(
        tabs.map((tab) => ({ ...tab, active: false })),
        'active',
      )?.id,
    ).toBe(1)
  })
})
