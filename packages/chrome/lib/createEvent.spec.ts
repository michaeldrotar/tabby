import { createEvent } from './createEvent.js'
import { describe, it, expect, vi } from 'vitest'

describe('createEvent', () => {
  it('registers and removes listeners, and reports hasListeners/hasListener', () => {
    const event = createEvent('updated')
    const listener = vi.fn()
    const someFn = vi.fn()

    expect(event.listener.hasListeners()).toBe(false)
    expect(event.listener.hasListener(listener)).toBe(false)
    expect(event.listener.hasListener(someFn)).toBe(false)

    event.listener.addListener(listener)
    expect(event.listener.hasListeners()).toBe(true)
    expect(event.listener.hasListener(listener)).toBe(true)
    expect(event.listener.hasListener(someFn)).toBe(false)

    event.listener.removeListener(listener)
    expect(event.listener.hasListener(listener)).toBe(false)
    expect(event.listener.hasListeners()).toBe(false)
  })

  it('emit forwards arguments to listeners', () => {
    const event = createEvent<(a: number, b: string) => void>('args')
    const listener = vi.fn()

    event.listener.addListener(listener)
    event.emit(42, 'hello')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(42, 'hello')
  })

  it('supports duplicate registrations and removeListener removes one registration', () => {
    const event = createEvent('dupe')
    const listener = vi.fn()

    event.listener.addListener(listener)
    event.listener.addListener(listener)

    event.emit()
    expect(listener).toHaveBeenCalledTimes(2)

    event.listener.removeListener(listener)
    event.emit()
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('removing a non-existent listener is a no-op', () => {
    const event = createEvent('noop')
    const listener = () => {}
    expect(() => event.listener.removeListener(listener)).not.toThrow()
  })

  it('errors thrown in listener propagate to the emitter call', () => {
    const evt = createEvent('throw')
    const bad = () => {
      throw new Error('boom')
    }
    evt.listener.addListener(bad)
    expect(() => evt.emit()).toThrow('boom')
  })
})
