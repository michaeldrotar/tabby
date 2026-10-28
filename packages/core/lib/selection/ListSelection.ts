import { reduceSelectionIntent } from './SelectionModel.js'
import type {
  SelectionIntent,
  SelectionItemRef,
  SelectionMode,
} from './SelectionModel.js'

export type ListSelection = {
  ids: string[]
  mode: SelectionMode
  anchor: string | null
  baseIds: string[] | null
  shiftAnchor: string | null
}
export type ListSelectionIntent =
  | { type: 'click'; id: string; shift?: boolean; toggle?: boolean }
  | { type: 'arrow'; id: string; shift?: boolean; focusedBeforeMove?: string }
  | { type: 'space'; id: string }
  | { type: 'select-all' }
  | { type: 'escape' }

export const emptyListSelection = (): ListSelection => ({
  ids: [],
  mode: 'default',
  anchor: null,
  baseIds: null,
  shiftAnchor: null,
})

/** Adapts native string IDs to the same selection rules used by the tab list. */
export const reduceListSelection = (
  state: ListSelection,
  intent: ListSelectionIntent,
  order: readonly string[],
): ListSelection => {
  const indexes = new Map(order.map((id, index) => [id, index]))
  const item = (id?: string | null): SelectionItemRef | null => {
    const index = id === undefined || id === null ? undefined : indexes.get(id)
    return index === undefined ? null : { type: 'tab', id: index }
  }
  const ids = (values: readonly string[]) =>
    new Set(
      values.flatMap((id) => {
        const index = indexes.get(id)
        return index === undefined ? [] : [index]
      }),
    )
  const orderedItems = order.map((_, id) => ({ type: 'tab' as const, id }))
  let selectionIntent: SelectionIntent
  if (intent.type === 'escape') selectionIntent = { type: 'escape' }
  else if (intent.type === 'select-all')
    selectionIntent = { type: 'select-all', pane: 'tab', orderedItems }
  else {
    const target = item(intent.id)
    if (!target) return state
    if (intent.type === 'click')
      selectionIntent = {
        type: 'click',
        pane: 'tab',
        item: target,
        orderedItems,
        shift: !!intent.shift,
        toggle: !!intent.toggle,
      }
    else if (intent.type === 'space')
      selectionIntent = { type: 'space', pane: 'tab', item: target }
    else
      selectionIntent = intent.shift
        ? {
            type: 'shift-arrow',
            pane: 'tab',
            item: target,
            orderedItems,
            focusedBeforeMove: item(intent.focusedBeforeMove) ?? undefined,
          }
        : { type: 'arrow', pane: 'tab', item: target }
  }
  const result = reduceSelectionIntent(
    {
      selection: {
        tabIds: ids(state.ids),
        groupIds: new Set(),
        mode: state.mode,
      },
      interaction: {
        anchorItem: item(state.anchor),
        currentPane: 'tab',
        baseSelection: state.baseIds
          ? { tabIds: ids(state.baseIds), groupIds: new Set() }
          : null,
        shiftArrowAnchor: item(state.shiftAnchor),
      },
    },
    selectionIntent,
  )
  return {
    ids: [...result.selection.tabIds].map((id) => order[id]!),
    mode: result.selection.mode,
    anchor: result.interaction.anchorItem
      ? order[result.interaction.anchorItem.id]!
      : null,
    baseIds: result.interaction.baseSelection
      ? [...result.interaction.baseSelection.tabIds].map((id) => order[id]!)
      : null,
    shiftAnchor: result.interaction.shiftArrowAnchor
      ? order[result.interaction.shiftArrowAnchor.id]!
      : null,
  }
}
