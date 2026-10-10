import { describe, expect, it } from 'vitest'
import { initializeTabManagerView } from './initializeTabManagerView'
import { createTabManagerView } from './view'
import type { BrowserSnapshot } from '@extension/core'

const snapshot: BrowserSnapshot = {
  state: 'loaded',
  revision: 1,
  windows: [{ id: 1 }, { id: 2, focused: true }],
  tabs: [{ id: 21, windowId: 2, index: 0, title: 'Active', active: true }],
  groups: [],
}
describe('host view initialization', () => {
  it('seeds the owning window and active-tab scroll target before interaction', () => {
    const view = createTabManagerView()
    initializeTabManagerView(view, snapshot, 2)
    expect(view.getState()).toMatchObject({
      viewedWindowId: 2,
      focusedItem: { type: 'window', id: 2 },
      scrollToItem: { id: 21, revision: 1 },
    })
    expect(view.getState().selection.selection.windowIds).toEqual(new Set([2]))
  })
  it.each(['tab', 'group'] as const)(
    'preserves %s input that preceded a late host load',
    (kind) => {
      const view = createTabManagerView({ viewedWindowId: 1 })
      const state = view.getState()
      state.selection.selection[kind === 'tab' ? 'tabIds' : 'groupIds'].add(11)
      const before = structuredClone(state)
      initializeTabManagerView(view, snapshot, 2)
      expect(view.getState()).toEqual(before)
    },
  )
})
