import { useCallback } from 'react'
import {
  clearSelectionInteractionAnchor,
  createSelectionInteractionState,
  reduceSelectionIntent,
} from './SelectionModel'
import { useSelectionStore } from './SelectionStore'
import type {
  PaneContext,
  SelectionIntent,
  SelectionInteractionState,
  SelectionItemRef,
  SelectionItemType,
} from './SelectionModel'
import type { SelectionMode } from './SelectionStore'

export type { PaneContext, SelectionItemRef, SelectionItemType }

/**
 * This adapter maps the app's current selection to the input-independent
 * selection model. The model receives normalized modifiers and explicit item
 * order; it never reads a React event, the DOM, or Chrome state.
 */
let interactionState: SelectionInteractionState =
  createSelectionInteractionState()

export const clearAnchorIfRemoved = (item: SelectionItemRef): void => {
  interactionState = clearSelectionInteractionAnchor(interactionState, item)
}

export const resetSelectionInteraction = (): void => {
  interactionState = createSelectionInteractionState()
}

export const useSelectionInteraction = () => {
  const applyIntent = useCallback((intent: SelectionIntent): boolean => {
    const store = useSelectionStore.getState()
    const previous = {
      windowIds: store.windowIds,
      expandedWindowIds: store.expandedWindowIds,
      groupIds: store.groupIds,
      tabIds: store.tabIds,
      mode: store.mode,
    }
    const next = reduceSelectionIntent(
      { selection: previous, interaction: interactionState },
      intent,
    )

    interactionState = next.interaction
    const changed =
      previous.mode !== next.selection.mode ||
      !sameIds(previous.windowIds, next.selection.windowIds) ||
      !sameIds(previous.expandedWindowIds, next.selection.expandedWindowIds) ||
      !sameIds(previous.groupIds, next.selection.groupIds) ||
      !sameIds(previous.tabIds, next.selection.tabIds)

    if (changed) useSelectionStore.setState(next.selection)
    return changed
  }, [])

  const handleClick = useCallback(
    (
      item: SelectionItemRef,
      modifiers: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
      paneContext: PaneContext,
      orderedItems: readonly SelectionItemRef[],
    ) => {
      applyIntent({
        type: 'click',
        item,
        pane: paneContext,
        shift: modifiers.shiftKey,
        toggle: modifiers.metaKey || modifiers.ctrlKey,
        orderedItems,
      })
    },
    [applyIntent],
  )

  const handleWindowContextMenu = useCallback(
    (windowId: number) => {
      applyIntent({ type: 'window-context-menu', windowId })
    },
    [applyIntent],
  )

  const handleKeyboard = useCallback(
    (item: SelectionItemRef, key: string, paneContext: PaneContext) => {
      if (key === ' ') {
        applyIntent({ type: 'space', item, pane: paneContext })
      } else if (key === 'Escape') {
        applyIntent({ type: 'escape', item, pane: paneContext })
      }
    },
    [applyIntent],
  )

  const handleArrowNavigation = useCallback(
    (
      item: SelectionItemRef,
      paneContext: PaneContext,
      options?: { forceSingleSelect?: boolean },
    ): boolean =>
      applyIntent({
        type: 'arrow',
        item,
        pane: paneContext,
        forceSingleSelect: options?.forceSingleSelect,
      }),
    [applyIntent],
  )

  const handleShiftArrow = useCallback(
    (
      item: SelectionItemRef,
      paneContext: PaneContext,
      focusedBeforeMove: SelectionItemRef | undefined,
      orderedItems: readonly SelectionItemRef[],
    ) => {
      applyIntent({
        type: 'shift-arrow',
        item,
        pane: paneContext,
        focusedBeforeMove,
        orderedItems,
      })
    },
    [applyIntent],
  )

  const selectAll = useCallback(
    (paneContext: PaneContext, orderedItems: readonly SelectionItemRef[]) => {
      applyIntent({ type: 'select-all', pane: paneContext, orderedItems })
    },
    [applyIntent],
  )

  const getMode = useCallback(
    (): SelectionMode => useSelectionStore.getState().mode,
    [],
  )
  const getAnchor = useCallback(
    (): SelectionItemRef | null => interactionState.anchorItem,
    [],
  )
  const getPaneContext = useCallback(
    (): PaneContext | null => interactionState.currentPane,
    [],
  )

  return {
    handleClick,
    handleWindowContextMenu,
    handleKeyboard,
    handleArrowNavigation,
    handleShiftArrow,
    selectAll,
    getMode,
    getAnchor,
    getPaneContext,
  }
}

const sameIds = (left: Set<number>, right: Set<number>): boolean => {
  if (left.size !== right.size) return false
  for (const id of left) if (!right.has(id)) return false
  return true
}
