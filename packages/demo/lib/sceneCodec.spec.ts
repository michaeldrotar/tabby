import { describe, expect, it } from 'vitest'
import { deserializeDemoState, serializeDemoState } from './sceneCodec'

describe('scene JSON checkpoints', () => {
  it('round trips versioned data, view selection, scroll and preferences', () => {
    const checkpoint = {
      sceneVersion: 1,
      data: { windows: [{ id: 1 }] },
      view: { tabIds: new Set([11, 12]), openPanel: 'move', scrollTop: 180 },
      preferences: { theme: 'dark' },
    }
    expect(deserializeDemoState(serializeDemoState(checkpoint))).toEqual(
      checkpoint,
    )
    expect(() => deserializeDemoState('invalid JSON')).toThrow()
  })
})
