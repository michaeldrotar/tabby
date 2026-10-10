import { describe, expect, it } from 'vitest'
import { createDemoPlayer } from './player'

const clone = (value: {
  tabs: number[]
  selection: Set<number>
  panel: boolean
  scroll: number
  clock: number
}) => ({ ...value, tabs: [...value.tabs], selection: new Set(value.selection) })

describe('demo playback', () => {
  it('seeks complete checkpoints, pauses, rewinds and rejects stale ticks', () => {
    let now = 0
    const callbacks: (() => void)[] = []
    let restored = {
      tabs: [1, 2],
      selection: new Set<number>(),
      panel: false,
      scroll: 0,
      clock: 0,
    }
    const initial = clone(restored)
    const player = createDemoPlayer(
      [
        { at: 0, title: 'Ready', state: initial },
        {
          at: 100,
          title: 'Select',
          state: {
            ...initial,
            selection: new Set([1]),
            panel: true,
            scroll: 50,
            clock: 100,
          },
        },
        {
          at: 200,
          title: 'Close',
          state: { ...initial, tabs: [2], clock: 200 },
        },
      ],
      (state) => {
        restored = state
      },
      {
        now: () => now,
        schedule: (callback) => {
          callbacks.push(callback)
          return () => {}
        },
      },
      clone,
    )
    player.next()
    expect(restored).toMatchObject({
      selection: new Set([1]),
      panel: true,
      scroll: 50,
      clock: 100,
    })
    player.play()
    now = 180
    callbacks.shift()!()
    expect(restored.tabs).toEqual([2])
    expect(player.getSnapshot()).toMatchObject({
      playing: false,
      title: 'Close',
    })
    player.rewind()
    expect(restored).toEqual(initial)
    player.play()
    const staleTick = callbacks.at(-1)!
    player.pause()
    now = 500
    staleTick()
    expect(player.getSnapshot()).toMatchObject({ time: 0, playing: false })
    expect(restored).toEqual(initial)
    player.seek(200)
    player.previous()
    expect(player.getSnapshot()).toMatchObject({ time: 100, title: 'Select' })
    player.dispose()
  })

  it('keeps transport status when jumping and cancels the previous scheduled tick', () => {
    let now = 0
    const callbacks: (() => void)[] = []
    const player = createDemoPlayer(
      [
        { at: 0, title: 'Start', state: 0 },
        { at: 100, title: 'Middle', state: 1 },
        { at: 200, title: 'End', state: 2 },
      ],
      () => {},
      {
        now: () => now,
        schedule: (callback) => {
          callbacks.push(callback)
          return () => {}
        },
      },
      (state) => state,
    )
    player.play()
    const stale = callbacks[0]!
    player.seek(100)
    expect(player.getSnapshot()).toMatchObject({ time: 100, playing: true })
    now = 50
    stale()
    expect(player.getSnapshot().time).toBe(100)
    callbacks.at(-1)!()
    expect(player.getSnapshot().time).toBe(150)
    player.pause()
    player.previous()
    expect(player.getSnapshot()).toMatchObject({ time: 0, playing: false })
  })

  it('validates ordering and clamps seek positions', () => {
    const scheduler = { now: () => 0, schedule: () => () => {} }
    expect(() =>
      createDemoPlayer(
        [{ at: 4, title: 'Invalid', state: 0 }],
        () => {},
        scheduler,
        (state) => state,
      ),
    ).toThrow()
    const player = createDemoPlayer(
      [
        { at: 0, title: 'Start', state: 0 },
        { at: 5, title: 'End', state: 1 },
      ],
      () => {},
      scheduler,
      (state) => state,
    )
    player.seek(100)
    expect(player.getSnapshot().time).toBe(5)
    player.seek(-100)
    expect(player.getSnapshot().time).toBe(0)
  })
})
