import { beforeEach, describe, expect, it } from 'vitest'
import { useSelectionStore } from './SelectionStore'

/**
 * Helper to get total count from store state
 */
const getTotalCount = () => {
  const state = useSelectionStore.getState()
  return state.windowIds.size + state.groupIds.size + state.tabIds.size
}

describe('SelectionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSelectionStore.getState().clear()
    useSelectionStore.getState().exitMultiSelectMode()
  })

  describe('single item selection', () => {
    it('selects a single tab and clears others', () => {
      useSelectionStore.getState().setTab(1)

      // Get fresh state after mutation
      const state = useSelectionStore.getState()
      expect(state.tabIds.has(1)).toBe(true)
      expect(getTotalCount()).toBe(1)
    })

    it('selects a single window and clears other types', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.setWindow(2)

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.windowIds.has(2)).toBe(true)
      expect(state.tabIds.has(1)).toBe(false)
      expect(getTotalCount()).toBe(1)
    })

    it('selects a single group and clears others', () => {
      const store = useSelectionStore.getState()
      store.setWindow(1)
      store.setTab(2)
      store.setGroup(3)

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.groupIds.has(3)).toBe(true)
      expect(state.windowIds.has(1)).toBe(false)
      expect(state.tabIds.has(2)).toBe(false)
      expect(getTotalCount()).toBe(1)
    })
  })

  describe('adding items to selection', () => {
    it('adds a tab to existing selection', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.addTab(2)

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.tabIds.has(1)).toBe(true)
      expect(state.tabIds.has(2)).toBe(true)
      expect(getTotalCount()).toBe(2)
    })

    it('adds multiple tabs to selection', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.addTabs([2, 3, 4])

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(getTotalCount()).toBe(4)
      expect(state.tabIds.has(3)).toBe(true)
    })

    it('allows mixed type selections when adding', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.addGroup(2)
      store.addWindow(3)

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.tabIds.has(1)).toBe(true)
      expect(state.groupIds.has(2)).toBe(true)
      expect(state.windowIds.has(3)).toBe(true)
      expect(getTotalCount()).toBe(3)
    })
  })

  describe('removing items from selection', () => {
    it('removes a single tab from selection', () => {
      const store = useSelectionStore.getState()
      store.setTabs([1, 2, 3])
      store.removeTab(2)

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.tabIds.has(1)).toBe(true)
      expect(state.tabIds.has(2)).toBe(false)
      expect(state.tabIds.has(3)).toBe(true)
      expect(getTotalCount()).toBe(2)
    })

    it('removes multiple tabs from selection', () => {
      const store = useSelectionStore.getState()
      store.setTabs([1, 2, 3, 4, 5])
      store.removeTabs([2, 4])

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(getTotalCount()).toBe(3)
      expect(state.tabIds.has(2)).toBe(false)
      expect(state.tabIds.has(4)).toBe(false)
    })
  })

  describe('clearing selection', () => {
    it('clears all selections', () => {
      const store = useSelectionStore.getState()
      store.addWindow(1)
      store.addGroup(2)
      store.addTab(3)
      store.clear()

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(getTotalCount()).toBe(0)
      expect(state.windowIds.has(1)).toBe(false)
      expect(state.groupIds.has(2)).toBe(false)
      expect(state.tabIds.has(3)).toBe(false)
    })
  })

  describe('selection mode', () => {
    it('starts in default mode', () => {
      const store = useSelectionStore.getState()
      expect(store.mode).toBe('default')
    })

    it('can enter multi-select mode', () => {
      useSelectionStore.getState().enterMultiSelectMode()

      // Need to get fresh state after mutation
      const state = useSelectionStore.getState()
      expect(state.mode).toBe('multi-select')
    })

    it('can exit multi-select mode', () => {
      const store = useSelectionStore.getState()
      store.enterMultiSelectMode()
      store.exitMultiSelectMode()

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.mode).toBe('default')
    })

    it('preserves selection when changing modes', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.enterMultiSelectMode()

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(state.tabIds.has(1)).toBe(true)
      expect(state.mode).toBe('multi-select')
    })
  })

  describe('bulk operations', () => {
    it('sets multiple windows at once', () => {
      const store = useSelectionStore.getState()
      store.setWindows([1, 2, 3])

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(getTotalCount()).toBe(3)
      expect(state.windowIds.has(1)).toBe(true)
      expect(state.windowIds.has(2)).toBe(true)
      expect(state.windowIds.has(3)).toBe(true)
    })

    it('sets multiple groups at once', () => {
      const store = useSelectionStore.getState()
      store.setGroups([10, 20, 30])

      // Get fresh state after mutations
      const state = useSelectionStore.getState()
      expect(getTotalCount()).toBe(3)
      expect(state.groupIds.has(20)).toBe(true)
    })
  })

  describe('accessing selection state', () => {
    it('can check selection via Sets directly', () => {
      const store = useSelectionStore.getState()
      store.addWindow(1)
      store.addGroup(2)
      store.addTab(3)

      // Get fresh state after mutations
      const state = useSelectionStore.getState()

      expect(state.windowIds.has(1)).toBe(true)
      expect(state.groupIds.has(2)).toBe(true)
      expect(state.tabIds.has(3)).toBe(true)
    })
  })
})
