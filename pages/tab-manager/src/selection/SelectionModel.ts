import type { SelectionMode, SelectionState } from './SelectionStore'

export type SelectionItemType = 'window' | 'group' | 'tab'
export type PaneContext = 'window' | 'tab' | 'tree'

export type SelectionItemRef = {
  type: SelectionItemType
  id: number
}

export type SelectionSnapshot = Pick<
  SelectionState,
  'windowIds' | 'expandedWindowIds' | 'groupIds' | 'tabIds'
>

export type SelectionInteractionState = {
  anchorItem: SelectionItemRef | null
  currentPane: PaneContext | null
  baseSelection: SelectionSnapshot | null
  shiftArrowAnchor: SelectionItemRef | null
}

export type SelectionModelState = SelectionSnapshot & {
  mode: SelectionMode
}

export type SelectionIntent =
  | {
      type: 'click'
      item: SelectionItemRef
      pane: PaneContext
      shift: boolean
      toggle: boolean
      orderedItems: readonly SelectionItemRef[]
    }
  | { type: 'window-context-menu'; windowId: number }
  | { type: 'space'; item: SelectionItemRef; pane: PaneContext }
  | { type: 'escape'; item: SelectionItemRef; pane: PaneContext }
  | {
      type: 'arrow'
      item: SelectionItemRef
      pane: PaneContext
      forceSingleSelect?: boolean
    }
  | {
      type: 'shift-arrow'
      item: SelectionItemRef
      pane: PaneContext
      focusedBeforeMove?: SelectionItemRef
      orderedItems: readonly SelectionItemRef[]
    }
  | {
      type: 'select-all'
      pane: PaneContext
      orderedItems: readonly SelectionItemRef[]
    }

export type SelectionModelContext = {
  selection: SelectionModelState
  interaction: SelectionInteractionState
}

export const createSelectionInteractionState =
  (): SelectionInteractionState => ({
    anchorItem: null,
    currentPane: null,
    baseSelection: null,
    shiftArrowAnchor: null,
  })

export const createEmptySelectionSnapshot = (): SelectionSnapshot => ({
  windowIds: new Set(),
  expandedWindowIds: new Set(),
  groupIds: new Set(),
  tabIds: new Set(),
})

export const reduceSelectionIntent = (
  context: SelectionModelContext,
  intent: SelectionIntent,
): SelectionModelContext => {
  const selection = cloneSelection(context.selection)
  const interaction = { ...context.interaction }

  if (intent.type === 'window-context-menu') {
    const item: SelectionItemRef = { type: 'window', id: intent.windowId }
    interaction.currentPane = 'window'
    interaction.shiftArrowAnchor = null

    if (!selection.windowIds.has(intent.windowId)) {
      selectOnly(selection, item)
      selection.mode = 'default'
      interaction.anchorItem = item
    }

    selection.expandedWindowIds.add(intent.windowId)
    interaction.baseSelection = cloneSnapshot(selection)
    return { selection, interaction }
  }

  if (intent.type === 'click') {
    const isCrossPane =
      interaction.currentPane !== null &&
      interaction.currentPane !== intent.pane

    // Command/control-click can add a window and tabs to the same selection.
    // Plain and range clicks keep the existing single-pane behavior.
    if (isCrossPane && !intent.toggle) {
      clearSelection(selection)
      interaction.anchorItem = null
      interaction.baseSelection = null
    }
    interaction.currentPane = intent.pane
    interaction.shiftArrowAnchor = null

    if (intent.shift && interaction.anchorItem) {
      const range = getSelectionRange(
        intent.orderedItems,
        interaction.anchorItem,
        intent.item,
      )
      if (range.length > 0) {
        const base = interaction.baseSelection ?? createEmptySelectionSnapshot()
        const next = cloneSnapshot(base)
        for (const item of range) addItem(next, item)
        replaceSelection(selection, next)
      } else {
        selectOnly(selection, intent.item)
        interaction.anchorItem = intent.item
        interaction.baseSelection = cloneSnapshot(selection)
      }
      selection.mode = 'default'
    } else if (intent.toggle) {
      toggleItem(selection, intent.item)
      interaction.anchorItem = intent.item
      interaction.baseSelection = cloneSnapshot(selection)
      selection.mode = 'default'
    } else {
      selectOnly(selection, intent.item)
      interaction.anchorItem = intent.item
      interaction.baseSelection = cloneSnapshot(selection)
      selection.mode = 'default'
    }

    if (intent.item.type === 'window') {
      if (intent.shift || intent.toggle) {
        expandSelectedWindows(selection)
      } else {
        selection.expandedWindowIds.delete(intent.item.id)
      }
    }

    return { selection, interaction }
  }

  if (intent.type === 'space') {
    interaction.shiftArrowAnchor = null
    interaction.currentPane = intent.pane
    if (selection.mode === 'default') {
      selection.mode = 'multi-select'
      selectOnly(selection, intent.item)
      interaction.anchorItem = intent.item
    } else {
      toggleItem(selection, intent.item)
      interaction.anchorItem = intent.item
    }
    if (intent.item.type === 'window') expandSelectedWindows(selection)
    return { selection, interaction }
  }

  if (intent.type === 'escape') {
    clearSelection(selection)
    selection.mode = 'default'
    selectOnly(selection, intent.item)
    interaction.anchorItem = intent.item
    interaction.currentPane = intent.pane
    interaction.baseSelection = cloneSnapshot(selection)
    interaction.shiftArrowAnchor = null
    return { selection, interaction }
  }

  if (intent.type === 'arrow') {
    interaction.shiftArrowAnchor = null
    interaction.currentPane = intent.pane
    if (intent.forceSingleSelect || selection.mode === 'default') {
      selection.mode = 'default'
      selectOnly(selection, intent.item)
      interaction.anchorItem = intent.item
      interaction.baseSelection = createEmptySelectionSnapshot()
      return { selection, interaction }
    }
    return { selection, interaction }
  }

  if (intent.type === 'shift-arrow') {
    interaction.currentPane = intent.pane
    let anchor: SelectionItemRef | null

    if (selection.mode === 'multi-select') {
      if (!interaction.shiftArrowAnchor) {
        interaction.shiftArrowAnchor = intent.focusedBeforeMove ?? intent.item
        interaction.baseSelection = cloneSnapshot(selection)
      }
      anchor = interaction.shiftArrowAnchor
    } else {
      if (!interaction.anchorItem) {
        interaction.anchorItem = intent.item
        interaction.baseSelection = createEmptySelectionSnapshot()
        selectOnly(selection, intent.item)
        if (intent.pane === 'window') expandSelectedWindows(selection)
        return { selection, interaction }
      }
      anchor = interaction.anchorItem
    }

    const range = getSelectionRange(intent.orderedItems, anchor, intent.item)
    if (range.length === 0) {
      selectOnly(selection, intent.item)
      interaction.anchorItem = intent.item
      interaction.baseSelection = createEmptySelectionSnapshot()
      if (intent.pane === 'window') expandSelectedWindows(selection)
      return { selection, interaction }
    }

    const next = cloneSnapshot(
      interaction.baseSelection ?? createEmptySelectionSnapshot(),
    )
    for (const item of range) addItem(next, item)
    replaceSelection(selection, next)
    if (intent.pane === 'window') expandSelectedWindows(selection)
    return { selection, interaction }
  }

  interaction.shiftArrowAnchor = null
  interaction.currentPane = intent.pane
  if (intent.orderedItems.length === 0) return { selection, interaction }

  const next = createEmptySelectionSnapshot()
  for (const item of intent.orderedItems) addItem(next, item)
  replaceSelection(selection, next)
  if (intent.pane === 'window') expandSelectedWindows(selection)
  interaction.anchorItem = intent.orderedItems[0] ?? null
  interaction.baseSelection = cloneSnapshot(next)
  return { selection, interaction }
}

export const clearSelectionInteractionAnchor = (
  interaction: SelectionInteractionState,
  item: SelectionItemRef,
): SelectionInteractionState => {
  const next = { ...interaction }
  if (sameItem(next.anchorItem, item)) next.anchorItem = null
  if (sameItem(next.shiftArrowAnchor, item)) next.shiftArrowAnchor = null
  if (next.baseSelection) removeItem(next.baseSelection, item)
  return next
}

export const getSelectionRange = (
  orderedItems: readonly SelectionItemRef[],
  anchor: SelectionItemRef | null,
  target: SelectionItemRef,
): SelectionItemRef[] => {
  if (!anchor) return []
  const anchorIndex = orderedItems.findIndex((item) => sameItem(item, anchor))
  const targetIndex = orderedItems.findIndex((item) => sameItem(item, target))
  if (anchorIndex === -1 || targetIndex === -1) return []

  if (anchorIndex <= targetIndex) {
    return orderedItems.slice(anchorIndex, targetIndex + 1)
  }
  return [...orderedItems.slice(targetIndex, anchorIndex + 1)].reverse()
}

const cloneSelection = (
  selection: SelectionModelState,
): SelectionModelState => ({
  ...cloneSnapshot(selection),
  mode: selection.mode,
})

const cloneSnapshot = (snapshot: SelectionSnapshot): SelectionSnapshot => ({
  windowIds: new Set(snapshot.windowIds),
  expandedWindowIds: new Set(snapshot.expandedWindowIds),
  groupIds: new Set(snapshot.groupIds),
  tabIds: new Set(snapshot.tabIds),
})

const clearSelection = (selection: SelectionModelState): void => {
  selection.windowIds.clear()
  selection.expandedWindowIds.clear()
  selection.groupIds.clear()
  selection.tabIds.clear()
}

const replaceSelection = (
  selection: SelectionModelState,
  next: SelectionSnapshot,
): void => {
  selection.windowIds = new Set(next.windowIds)
  selection.expandedWindowIds = new Set(next.expandedWindowIds)
  selection.groupIds = new Set(next.groupIds)
  selection.tabIds = new Set(next.tabIds)
}

const selectOnly = (
  selection: SelectionModelState,
  item: SelectionItemRef,
): void => {
  clearSelection(selection)
  addItem(selection, item)
}

const toggleItem = (
  selection: SelectionSnapshot,
  item: SelectionItemRef,
): void => {
  const set = getItemSet(selection, item.type)
  if (set.has(item.id)) {
    set.delete(item.id)
    if (item.type === 'window') selection.expandedWindowIds.delete(item.id)
  } else {
    set.add(item.id)
  }
}

const addItem = (
  selection: SelectionSnapshot,
  item: SelectionItemRef,
): void => {
  getItemSet(selection, item.type).add(item.id)
}

const removeItem = (
  selection: SelectionSnapshot,
  item: SelectionItemRef,
): void => {
  getItemSet(selection, item.type).delete(item.id)
  if (item.type === 'window') selection.expandedWindowIds.delete(item.id)
}

const getItemSet = (
  selection: SelectionSnapshot,
  type: SelectionItemType,
): Set<number> => {
  if (type === 'window') return selection.windowIds
  if (type === 'group') return selection.groupIds
  return selection.tabIds
}

const expandSelectedWindows = (selection: SelectionSnapshot): void => {
  selection.expandedWindowIds = new Set(selection.windowIds)
}

const sameItem = (
  left: SelectionItemRef | null,
  right: SelectionItemRef,
): boolean => left?.type === right.type && left.id === right.id
