export type SelectionMode = 'default' | 'multi-select'

export type SelectionState = {
  windowIds: Set<number>
  expandedWindowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>
  mode: SelectionMode
}

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

export type SelectionHierarchy = {
  tabs: readonly { id: number; windowId: number; groupId?: number }[]
  groups: readonly { id: number; windowId: number }[]
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
  | { type: 'escape' }
  | { type: 'focus-creation'; pane: PaneContext }
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
  hierarchy: SelectionHierarchy = { tabs: [], groups: [] },
): SelectionModelContext => {
  const selection = cloneSelection(context.selection)
  const interaction = { ...context.interaction }
  materializeChildren(selection, hierarchy)

  if (intent.type === 'focus-creation') {
    if (selection.mode === 'default') clearSelection(selection)
    return {
      selection,
      interaction: {
        ...createSelectionInteractionState(),
        currentPane: intent.pane,
      },
    }
  }

  if (intent.type === 'window-context-menu') {
    const item: SelectionItemRef = { type: 'window', id: intent.windowId }
    interaction.currentPane = 'window'
    interaction.shiftArrowAnchor = null

    if (!selection.windowIds.has(intent.windowId)) {
      selectOnly(selection, item, hierarchy)
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
        for (const item of range) addItem(next, item, hierarchy)
        replaceSelection(selection, next)
      } else {
        selectOnly(selection, intent.item, hierarchy)
        interaction.anchorItem = intent.item
        interaction.baseSelection = cloneSnapshot(selection)
      }
      selection.mode = 'default'
    } else if (intent.toggle) {
      toggleItem(selection, intent.item, hierarchy)
      interaction.anchorItem = intent.item
      interaction.baseSelection = cloneSnapshot(selection)
      selection.mode = 'default'
    } else {
      selectOnly(selection, intent.item, hierarchy)
      interaction.anchorItem = intent.item
      interaction.baseSelection = cloneSnapshot(selection)
      selection.mode = 'default'
    }

    if (intent.item.type === 'window') expandSelectedWindows(selection)

    return { selection, interaction }
  }

  if (intent.type === 'space') {
    interaction.shiftArrowAnchor = null
    interaction.currentPane = intent.pane
    if (
      selection.mode === 'default' &&
      !hasSelectedParent(selection, intent.item, hierarchy)
    ) {
      selection.mode = 'multi-select'
      selectOnly(selection, intent.item, hierarchy)
      interaction.anchorItem = intent.item
    } else {
      toggleItem(selection, intent.item, hierarchy)
      interaction.anchorItem = intent.item
    }
    selection.mode = 'multi-select'
    interaction.baseSelection = cloneSnapshot(selection)
    if (intent.item.type === 'window') expandSelectedWindows(selection)
    return { selection, interaction }
  }

  if (intent.type === 'escape') {
    return {
      selection: { ...createEmptySelectionSnapshot(), mode: 'default' },
      interaction: createSelectionInteractionState(),
    }
  }

  if (intent.type === 'arrow') {
    interaction.shiftArrowAnchor = null
    interaction.currentPane = intent.pane
    if (intent.forceSingleSelect || selection.mode === 'default') {
      selection.mode = 'default'
      selectOnly(selection, intent.item, hierarchy)
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
        selectOnly(selection, intent.item, hierarchy)
        if (intent.pane === 'window') expandSelectedWindows(selection)
        return { selection, interaction }
      }
      anchor = interaction.anchorItem
    }

    const range = getSelectionRange(intent.orderedItems, anchor, intent.item)
    if (range.length === 0) {
      selectOnly(selection, intent.item, hierarchy)
      interaction.anchorItem = intent.item
      interaction.baseSelection = createEmptySelectionSnapshot()
      if (intent.pane === 'window') expandSelectedWindows(selection)
      return { selection, interaction }
    }

    const next = cloneSnapshot(
      interaction.baseSelection ?? createEmptySelectionSnapshot(),
    )
    for (const item of range) addItem(next, item, hierarchy)
    replaceSelection(selection, next)
    if (intent.pane === 'window') expandSelectedWindows(selection)
    return { selection, interaction }
  }

  interaction.shiftArrowAnchor = null
  interaction.currentPane = intent.pane
  if (intent.orderedItems.length === 0) return { selection, interaction }

  const next = createEmptySelectionSnapshot()
  for (const item of intent.orderedItems) addItem(next, item, hierarchy)
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

export const remapSelectionInteractionTabIds = (
  interaction: SelectionInteractionState,
  replacements: ReadonlyMap<number, number>,
): SelectionInteractionState => {
  if (replacements.size === 0) return interaction

  const remapItem = (
    item: SelectionItemRef | null,
  ): SelectionItemRef | null => {
    if (!item || item.type !== 'tab') return item
    const id = replacements.get(item.id)
    return id === undefined ? item : { ...item, id }
  }

  const next: SelectionInteractionState = {
    ...interaction,
    anchorItem: remapItem(interaction.anchorItem),
    shiftArrowAnchor: remapItem(interaction.shiftArrowAnchor),
  }

  if (interaction.baseSelection) {
    const baseSelection = cloneSnapshot(interaction.baseSelection)
    for (const [previousId, currentId] of replacements) {
      if (baseSelection.tabIds.delete(previousId)) {
        baseSelection.tabIds.add(currentId)
      }
    }
    next.baseSelection = baseSelection
  }

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
  hierarchy: SelectionHierarchy,
): void => {
  clearSelection(selection)
  addItem(selection, item, hierarchy)
}

const getParents = (
  item: SelectionItemRef,
  hierarchy: SelectionHierarchy,
): { windowId: number; groupId?: number } | undefined =>
  item.type === 'tab'
    ? hierarchy.tabs.find((tab) => tab.id === item.id)
    : item.type === 'group'
      ? hierarchy.groups.find((group) => group.id === item.id)
      : undefined

const hasSelectedParent = (
  selection: SelectionSnapshot,
  item: SelectionItemRef,
  hierarchy: SelectionHierarchy,
): boolean => {
  const child = getParents(item, hierarchy)
  return Boolean(
    child &&
    (selection.windowIds.has(child.windowId) ||
      (item.type === 'tab' &&
        child.groupId !== undefined &&
        selection.groupIds.has(child.groupId))),
  )
}

const toggleItem = (
  selection: SelectionSnapshot,
  item: SelectionItemRef,
  hierarchy: SelectionHierarchy,
): void => {
  if (!getItemSet(selection, item.type).has(item.id)) {
    addItem(selection, item, hierarchy)
    return
  }
  removeItem(selection, item)
  if (item.type === 'window') {
    for (const group of hierarchy.groups)
      if (group.windowId === item.id) selection.groupIds.delete(group.id)
    for (const tab of hierarchy.tabs)
      if (tab.windowId === item.id) selection.tabIds.delete(tab.id)
  } else {
    const child = getParents(item, hierarchy)
    if (child) {
      selection.windowIds.delete(child.windowId)
      selection.expandedWindowIds.delete(child.windowId)
      if (item.type === 'tab' && child.groupId !== undefined)
        selection.groupIds.delete(child.groupId)
    }
    if (item.type === 'group')
      for (const tab of hierarchy.tabs)
        if (tab.groupId === item.id) selection.tabIds.delete(tab.id)
  }
}

const materializeChildren = (
  selection: SelectionSnapshot,
  hierarchy: SelectionHierarchy,
  parent?: SelectionItemRef,
): void => {
  const includesWindow = (id: number) =>
    parent
      ? parent.type === 'window' && parent.id === id
      : selection.windowIds.has(id)
  const includesGroup = (id: number) =>
    parent
      ? parent.type === 'group' && parent.id === id
      : selection.groupIds.has(id)
  for (const group of hierarchy.groups)
    if (includesWindow(group.windowId)) selection.groupIds.add(group.id)
  for (const tab of hierarchy.tabs)
    if (
      includesWindow(tab.windowId) ||
      (tab.groupId !== undefined && includesGroup(tab.groupId))
    )
      selection.tabIds.add(tab.id)
}

const addItem = (
  selection: SelectionSnapshot,
  item: SelectionItemRef,
  hierarchy: SelectionHierarchy,
): void => {
  getItemSet(selection, item.type).add(item.id)
  if (item.type !== 'tab') materializeChildren(selection, hierarchy, item)
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
