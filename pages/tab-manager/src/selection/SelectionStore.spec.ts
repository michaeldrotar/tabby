import { beforeEach, describe, expect, it } from 'vitest'
import { useSelectionStore } from './SelectionStore'

describe('SelectionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSelectionStore.getState().clear()
    useSelectionStore.getState().exitMultiSelectMode()
  })

  describe('single item selection', () => {
    it('selects a single tab and clears others', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)

      expect(store.isTabSelected(1)).toBe(true)
      expect(store.getTotalCount()).toBe(1)
    })

    it('selects a single window and clears other types', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.setWindow(2)

      expect(store.isWindowSelected(2)).toBe(true)
      expect(store.isTabSelected(1)).toBe(false)
      expect(store.getTotalCount()).toBe(1)
    })

    it('selects a single group and clears others', () => {
      const store = useSelectionStore.getState()
      store.setWindow(1)
      store.setTab(2)
      store.setGroup(3)

      expect(store.isGroupSelected(3)).toBe(true)
      expect(store.isWindowSelected(1)).toBe(false)
      expect(store.isTabSelected(2)).toBe(false)
      expect(store.getTotalCount()).toBe(1)
    })
  })

  describe('adding items to selection', () => {
    it('adds a tab to existing selection', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.addTab(2)

      expect(store.isTabSelected(1)).toBe(true)
      expect(store.isTabSelected(2)).toBe(true)
      expect(store.getTotalCount()).toBe(2)
    })

    it('adds multiple tabs to selection', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.addTabs([2, 3, 4])

      expect(store.getTotalCount()).toBe(4)
      expect(store.isTabSelected(3)).toBe(true)
    })

    it('allows mixed type selections when adding', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.addGroup(2)
      store.addWindow(3)

      expect(store.isTabSelected(1)).toBe(true)
      expect(store.isGroupSelected(2)).toBe(true)
      expect(store.isWindowSelected(3)).toBe(true)
      expect(store.getTotalCount()).toBe(3)
    })
  })

  describe('removing items from selection', () => {
    it('removes a single tab from selection', () => {
      const store = useSelectionStore.getState()
      store.setTabs([1, 2, 3])
      store.removeTab(2)

      expect(store.isTabSelected(1)).toBe(true)
      expect(store.isTabSelected(2)).toBe(false)
      expect(store.isTabSelected(3)).toBe(true)
      expect(store.getTotalCount()).toBe(2)
    })

    it('removes multiple tabs from selection', () => {
      const store = useSelectionStore.getState()
      store.setTabs([1, 2, 3, 4, 5])
      store.removeTabs([2, 4])

      expect(store.getTotalCount()).toBe(3)
      expect(store.isTabSelected(2)).toBe(false)
      expect(store.isTabSelected(4)).toBe(false)
    })
  })

  describe('clearing selection', () => {
    it('clears all selections', () => {
      const store = useSelectionStore.getState()
      store.addWindow(1)
      store.addGroup(2)
      store.addTab(3)
      store.clear()

      expect(store.getTotalCount()).toBe(0)
      expect(store.isWindowSelected(1)).toBe(false)
      expect(store.isGroupSelected(2)).toBe(false)
      expect(store.isTabSelected(3)).toBe(false)
    })
  })

  describe('selection mode', () => {
    it('starts in default mode', () => {
      const store = useSelectionStore.getState()
      expect(store.isMultiSelectMode()).toBe(false)
      expect(store.mode).toBe('default')
    })

    it('can enter multi-select mode', () => {
      const { enterMultiSelectMode, isMultiSelectMode } =
        useSelectionStore.getState()
      enterMultiSelectMode()

      // Need to get fresh state after mutation
      const state = useSelectionStore.getState()
      expect(isMultiSelectMode()).toBe(true)
      expect(state.mode).toBe('multi-select')
    })

    it('can exit multi-select mode', () => {
      const store = useSelectionStore.getState()
      store.enterMultiSelectMode()
      store.exitMultiSelectMode()

      expect(store.isMultiSelectMode()).toBe(false)
    })

    it('preserves selection when changing modes', () => {
      const store = useSelectionStore.getState()
      store.setTab(1)
      store.enterMultiSelectMode()

      expect(store.isTabSelected(1)).toBe(true)
      expect(store.isMultiSelectMode()).toBe(true)
    })
  })

  describe('bulk operations', () => {
    it('sets multiple windows at once', () => {
      const store = useSelectionStore.getState()
      store.setWindows([1, 2, 3])

      expect(store.getTotalCount()).toBe(3)
      expect(store.isWindowSelected(1)).toBe(true)
      expect(store.isWindowSelected(2)).toBe(true)
      expect(store.isWindowSelected(3)).toBe(true)
    })

    it('sets multiple groups at once', () => {
      const store = useSelectionStore.getState()
      store.setGroups([10, 20, 30])

      expect(store.getTotalCount()).toBe(3)
      expect(store.isGroupSelected(20)).toBe(true)
    })
  })

  describe('getSelection', () => {
    it('returns current selection state', () => {
      const store = useSelectionStore.getState()
      store.addWindow(1)
      store.addGroup(2)
      store.addTab(3)

      const selection = store.getSelection()

      expect(selection.windowIds.has(1)).toBe(true)
      expect(selection.groupIds.has(2)).toBe(true)
      expect(selection.tabIds.has(3)).toBe(true)
    })
  })
})
