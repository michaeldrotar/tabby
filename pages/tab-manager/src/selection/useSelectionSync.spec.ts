import { describe, expect, it } from 'vitest'
import {
  createSelectionInteractionState,
  reduceSelectionIntent,
  remapSelectionInteractionTabIds,
} from './SelectionModel'
import { findTabIdReplacements, remapSelectedTabIds } from './useSelectionSync'

describe('tab replacement selection sync', () => {
  it('maps a replaced tab identity and preserves its explicit selection', () => {
    const replacements = findTabIdReplacements(
      [{ id: 10 }, { id: 20 }],
      [{ id: 11, renderKey: 10 }, { id: 30 }],
    )

    expect(replacements).toEqual(new Map([[10, 11]]))
    expect(remapSelectedTabIds(new Set([10, 20]), replacements)).toEqual(
      new Set([11, 20]),
    )
  })

  it('preserves range selection after a selected tab gets a replacement ID', () => {
    const interaction = remapSelectionInteractionTabIds(
      {
        ...createSelectionInteractionState(),
        anchorItem: { type: 'tab', id: 10 },
        baseSelection: {
          windowIds: new Set(),
          expandedWindowIds: new Set(),
          groupIds: new Set(),
          tabIds: new Set([10, 20]),
        },
      },
      new Map([[10, 11]]),
    )
    const result = reduceSelectionIntent(
      {
        selection: {
          windowIds: new Set(),
          expandedWindowIds: new Set(),
          groupIds: new Set(),
          tabIds: new Set([11, 20]),
          mode: 'default',
        },
        interaction,
      },
      {
        type: 'click',
        item: { type: 'tab', id: 30 },
        pane: 'tab',
        shift: true,
        toggle: false,
        orderedItems: [
          { type: 'tab', id: 11 },
          { type: 'tab', id: 20 },
          { type: 'tab', id: 30 },
        ],
      },
    )

    expect(result.selection.tabIds).toEqual(new Set([11, 20, 30]))
  })
})
