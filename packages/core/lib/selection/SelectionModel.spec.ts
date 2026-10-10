import { describe, expect, it } from 'vitest'
import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
  getSelectionRange,
  reduceSelectionIntent,
} from './SelectionModel'
import type {
  SelectionItemRef,
  SelectionModelContext,
  SelectionModelState,
} from './SelectionModel'

const emptyContext = (): SelectionModelContext => ({
  selection: {
    ...createEmptySelectionSnapshot(),
    mode: 'default',
  },
  interaction: createSelectionInteractionState(),
})

const click = (
  context: SelectionModelContext,
  item: SelectionItemRef,
  options: {
    pane?: 'window' | 'tab' | 'tree'
    shift?: boolean
    toggle?: boolean
    orderedItems?: readonly SelectionItemRef[]
  } = {},
) =>
  reduceSelectionIntent(context, {
    type: 'click',
    item,
    pane: options.pane ?? 'tab',
    shift: options.shift ?? false,
    toggle: options.toggle ?? false,
    orderedItems: options.orderedItems ?? [],
  })

const ids = (
  selection: SelectionModelState,
  type: 'windowIds' | 'expandedWindowIds' | 'groupIds' | 'tabIds',
) => [...selection[type]].sort((a, b) => a - b)

describe('SelectionModel', () => {
  it('applies plain, modifier, and range clicks to explicit item order', () => {
    const order: SelectionItemRef[] = [1, 2, 3, 4, 5].map((id) => ({
      type: 'tab',
      id,
    }))
    let context = click(
      emptyContext(),
      { type: 'tab', id: 2 },
      { orderedItems: order },
    )
    context = click(
      context,
      { type: 'tab', id: 4 },
      {
        shift: true,
        orderedItems: order,
      },
    )
    expect(ids(context.selection, 'tabIds')).toEqual([2, 3, 4])

    context = click(
      context,
      { type: 'tab', id: 1 },
      {
        toggle: true,
        orderedItems: order,
      },
    )
    expect(ids(context.selection, 'tabIds')).toEqual([1, 2, 3, 4])

    context = click(
      context,
      { type: 'tab', id: 3 },
      {
        toggle: true,
        orderedItems: order,
      },
    )
    expect(ids(context.selection, 'tabIds')).toEqual([1, 2, 4])
  })

  it('keeps a modifier selection across panes and clears on a plain cross-pane click', () => {
    const windows: SelectionItemRef[] = [
      { type: 'window', id: 10 },
      { type: 'window', id: 20 },
    ]
    const tabs: SelectionItemRef[] = [
      { type: 'tab', id: 1 },
      { type: 'tab', id: 2 },
    ]
    let context = click(
      emptyContext(),
      { type: 'window', id: 10 },
      {
        pane: 'window',
        orderedItems: windows,
      },
    )
    context = click(
      context,
      { type: 'tab', id: 1 },
      {
        toggle: true,
        orderedItems: tabs,
      },
    )
    expect(ids(context.selection, 'windowIds')).toEqual([10])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([])
    expect(ids(context.selection, 'tabIds')).toEqual([1])

    context = click(context, { type: 'tab', id: 2 }, { orderedItems: tabs })
    expect(ids(context.selection, 'windowIds')).toEqual([])
    expect(ids(context.selection, 'tabIds')).toEqual([2])
  })

  it('expands every selected window only for modified or range selection', () => {
    const windows: SelectionItemRef[] = [10, 20, 30].map((id) => ({
      type: 'window',
      id,
    }))
    let context = click(
      emptyContext(),
      { type: 'window', id: 10 },
      {
        pane: 'window',
        orderedItems: windows,
      },
    )
    expect(ids(context.selection, 'windowIds')).toEqual([10])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([])

    context = click(
      context,
      { type: 'window', id: 20 },
      {
        pane: 'window',
        toggle: true,
        orderedItems: windows,
      },
    )
    expect(ids(context.selection, 'windowIds')).toEqual([10, 20])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([10, 20])

    context = click(
      context,
      { type: 'window', id: 10 },
      {
        pane: 'window',
        toggle: true,
        orderedItems: windows,
      },
    )
    expect(ids(context.selection, 'windowIds')).toEqual([20])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([20])

    context = click(
      emptyContext(),
      { type: 'window', id: 10 },
      {
        pane: 'window',
        orderedItems: windows,
      },
    )
    context = click(
      context,
      { type: 'window', id: 30 },
      {
        pane: 'window',
        shift: true,
        orderedItems: windows,
      },
    )
    expect(ids(context.selection, 'windowIds')).toEqual([10, 20, 30])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([10, 20, 30])
  })

  it('expands the right-clicked window without replacing its represented selection', () => {
    let context = click(
      emptyContext(),
      { type: 'window', id: 10 },
      {
        pane: 'window',
        orderedItems: [
          { type: 'window', id: 10 },
          { type: 'window', id: 20 },
        ],
      },
    )
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([])

    context = click(
      context,
      { type: 'tab', id: 5 },
      {
        toggle: true,
        orderedItems: [{ type: 'tab', id: 5 }],
      },
    )
    context = reduceSelectionIntent(context, {
      type: 'window-context-menu',
      windowId: 10,
    })

    expect(ids(context.selection, 'windowIds')).toEqual([10])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([10])
    expect(ids(context.selection, 'tabIds')).toEqual([5])

    context = reduceSelectionIntent(emptyContext(), {
      type: 'window-context-menu',
      windowId: 20,
    })
    expect(ids(context.selection, 'windowIds')).toEqual([20])
    expect(ids(context.selection, 'expandedWindowIds')).toEqual([20])
  })

  it('preserves the default versus multi-select keyboard behavior', () => {
    let context = emptyContext()
    context = reduceSelectionIntent(context, {
      type: 'arrow',
      item: { type: 'tab', id: 1 },
      pane: 'tab',
    })
    context = reduceSelectionIntent(context, {
      type: 'arrow',
      item: { type: 'tab', id: 2 },
      pane: 'tab',
    })
    expect(ids(context.selection, 'tabIds')).toEqual([2])

    context = reduceSelectionIntent(context, {
      type: 'space',
      item: { type: 'tab', id: 2 },
      pane: 'tab',
    })
    expect(context.selection.mode).toBe('multi-select')
    expect(ids(context.selection, 'tabIds')).toEqual([2])

    context = reduceSelectionIntent(context, {
      type: 'space',
      item: { type: 'tab', id: 3 },
      pane: 'tab',
    })
    context = reduceSelectionIntent(context, {
      type: 'arrow',
      item: { type: 'tab', id: 4 },
      pane: 'tab',
    })
    expect(ids(context.selection, 'tabIds')).toEqual([2, 3])

    context = reduceSelectionIntent(context, {
      type: 'escape',
      item: { type: 'tab', id: 4 },
      pane: 'tab',
    })
    expect(context.selection.mode).toBe('default')
    expect(ids(context.selection, 'tabIds')).toEqual([4])
  })

  it('uses only visible items for range and select-all intents', () => {
    const visibleItems: SelectionItemRef[] = [
      { type: 'group', id: 50 },
      { type: 'tab', id: 6 },
      { type: 'tab', id: 7 },
      { type: 'group', id: 60 },
      { type: 'tab', id: 9 },
    ]
    expect(
      getSelectionRange(visibleItems, visibleItems[0] ?? null, {
        type: 'tab',
        id: 9,
      }),
    ).toEqual(visibleItems)

    let context = click(
      emptyContext(),
      { type: 'group', id: 50 },
      {
        orderedItems: visibleItems,
      },
    )
    context = click(
      context,
      { type: 'tab', id: 9 },
      {
        shift: true,
        orderedItems: visibleItems,
      },
    )
    expect(ids(context.selection, 'groupIds')).toEqual([50, 60])
    expect(ids(context.selection, 'tabIds')).toEqual([6, 7, 9])

    context = reduceSelectionIntent(context, {
      type: 'select-all',
      pane: 'tab',
      orderedItems: visibleItems,
    })
    expect(ids(context.selection, 'groupIds')).toEqual([50, 60])
    expect(ids(context.selection, 'tabIds')).toEqual([6, 7, 9])
  })
})
