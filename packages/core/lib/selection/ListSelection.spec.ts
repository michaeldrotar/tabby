import { describe, expect, it } from 'vitest'
import { emptyListSelection, reduceListSelection } from './ListSelection.js'

describe('native list selection', () => {
  it('keeps native string identities and range anchors after external reordering', () => {
    const largeId = '9007199254740993123'
    let selection = reduceListSelection(
      emptyListSelection(),
      { type: 'click', id: largeId },
      [largeId, 'b', 'c'],
    )
    selection = reduceListSelection(
      selection,
      { type: 'click', id: 'c', shift: true },
      ['b', largeId, 'c'],
    )
    expect(selection.ids).toEqual([largeId, 'c'])
    selection = reduceListSelection(
      selection,
      { type: 'click', id: 'b', toggle: true },
      ['b', largeId, 'c'],
    )
    expect(selection.ids).toEqual([largeId, 'c', 'b'])
    expect(
      reduceListSelection(selection, { type: 'escape' }, ['b', largeId, 'c']),
    ).toEqual(emptyListSelection())
  })

  it('preserves multi-selection while moving focus and drops removed identities', () => {
    let selection = reduceListSelection(
      emptyListSelection(),
      { type: 'space', id: 'a' },
      ['a', 'b', 'c'],
    )
    selection = reduceListSelection(selection, { type: 'space', id: 'b' }, [
      'a',
      'b',
      'c',
    ])
    selection = reduceListSelection(selection, { type: 'arrow', id: 'c' }, [
      'b',
      'c',
    ])
    expect(selection.ids).toEqual(['b'])
    expect(selection.mode).toBe('multi-select')
    expect(
      reduceListSelection(selection, { type: 'select-all' }, ['b', 'c']).ids,
    ).toEqual(['b', 'c'])
  })
})
