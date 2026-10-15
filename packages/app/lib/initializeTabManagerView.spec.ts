import { describe, expect, it } from 'vitest'
import { initializeTabManagerView } from './initializeTabManagerView'
import { reconcileTabManagerView } from './tabManagerModel'
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
      focusedItem: null,
      scrollToItem: { id: 21, revision: 1 },
    })
    expect([...view.getState().selection.selection.tabIds]).toEqual([21])
  })
  it('seeds the owning window after default selection was reconciled before host startup finished', () => {
    const loaded = {
      ...snapshot,
      tabs: [
        ...snapshot.tabs,
        { id: 11, windowId: 1, index: 0, title: 'Owner', active: true },
      ],
    }
    const view = createTabManagerView()
    view.setState(reconcileTabManagerView(loaded, view.getState()), true)
    expect([...view.getState().selection.selection.tabIds]).toEqual([21])
    initializeTabManagerView(view, loaded, 1)
    expect(view.getState()).toMatchObject({
      viewedWindowId: 1,
      scrollToItem: { id: 11, revision: 1 },
    })
    expect([...view.getState().selection.selection.tabIds]).toEqual([11])
  })
  it.each(['tab', 'group'] as const)(
    'preserves %s input that preceded a late host load',
    (kind) => {
      const view = createTabManagerView({ viewedWindowId: 1 })
      const state = view.getState()
      state.selection.selection[kind === 'tab' ? 'tabIds' : 'groupIds'].add(11)
      view.setState({ hasUserInput: true })
      const before = structuredClone(view.getState())
      initializeTabManagerView(view, snapshot, 2)
      expect(view.getState()).toEqual(before)
    },
  )
})
