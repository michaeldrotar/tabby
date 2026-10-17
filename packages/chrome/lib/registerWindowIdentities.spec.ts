import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  registerWindowIdentities,
  WINDOW_IDENTITIES_KEY,
  WINDOW_LABELS_KEY,
} from './registerWindowIdentities.js'

const event = () => {
  const listeners = new Set<(...args: unknown[]) => unknown>()
  return {
    addListener: (listener: (...args: unknown[]) => unknown) =>
      listeners.add(listener),
    emit: (...args: unknown[]) =>
      listeners.forEach((listener) => listener(...args)),
  }
}
const sampleWindow = (
  id: number,
  urls = ['https://work.test/notes', 'https://work.test/docs'],
  incognito = false,
) => ({
  id,
  type: 'normal',
  incognito,
  tabs: urls.map((url, index) => ({ id: id * 10 + index, windowId: id, url })),
})
const setup = (
  initial = [sampleWindow(1)],
  persisted: Record<string, unknown> = {},
) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  let windows = initial
  const local = structuredClone(persisted),
    session: Record<string, unknown> = {}
  const area = (values: Record<string, unknown>) => ({
    get: async (key: string) => ({ [key]: structuredClone(values[key]) }),
    set: async (patch: Record<string, unknown>) =>
      Object.assign(values, structuredClone(patch)),
  })
  const api = {
    windows: {
      getAll: async () => structuredClone(windows),
      onCreated: event(),
      onRemoved: event(),
    },
    tabs: {
      onCreated: event(),
      onUpdated: event(),
      onRemoved: event(),
      onAttached: event(),
      onDetached: event(),
      onMoved: event(),
    },
    storage: { local: area(local), session: area(session) },
    runtime: { id: 'tabby', onMessage: event() },
  }
  const tracker = registerWindowIdentities(
    api as unknown as Parameters<typeof registerWindowIdentities>[0],
  )
  const edit = async (
    windowId: number,
    name: string,
    icon?: string,
    iconColor?: 'green',
  ) => {
    const response = new Promise<{ success?: boolean; error?: string }>(
      (resolve) =>
        api.runtime.onMessage.emit(
          { type: 'tabby-name-window', windowId, name, icon, iconColor },
          { id: 'tabby' },
          resolve,
        ),
    )
    return response
  }
  return {
    api,
    tracker: {
      settled: async () => {
        await tracker.settled()
        await vi.advanceTimersByTimeAsync(2000)
        await tracker.settled()
      },
    },
    local,
    session,
    edit,
    setWindows: (value: typeof windows) => {
      windows = value
    },
  }
}

afterEach(() => vi.useRealTimers())

describe('stored window identities', () => {
  it('stores names locally with URL hashes, follows live tab changes, and restores after restart with different IDs', async () => {
    const first = setup()
    expect(await first.edit(1, '  Project Atlas  ', 'globe', 'green')).toEqual({
      success: true,
    })
    expect(first.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      1: { name: 'Project Atlas', icon: 'globe', iconColor: 'green' },
    })
    expect(JSON.stringify(first.local)).not.toContain('https://')
    first.setWindows([
      sampleWindow(1, ['https://work.test/notes', 'https://work.test/new']),
    ])
    first.api.tabs.onUpdated.emit()
    await first.tracker.settled()
    const restarted = setup(
      [sampleWindow(88, ['https://work.test/new', 'https://work.test/notes'])],
      first.local,
    )
    await restarted.tracker.settled()
    expect(restarted.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      88: { name: 'Project Atlas', icon: 'globe', iconColor: 'green' },
    })
    expect(await restarted.edit(88, '')).toEqual({ success: true })
    expect(restarted.local[WINDOW_LABELS_KEY]).toEqual([])
    expect(restarted.session[WINDOW_IDENTITIES_KEY]).toEqual({})
  })
  it('keeps private names out of local storage and avoids attaching closed names to reused IDs', async () => {
    const resources = setup([
      sampleWindow(1),
      sampleWindow(2, ['https://private.test'], true),
    ])
    await resources.edit(1, 'Work', 'briefcase')
    await resources.edit(2, 'Private project', 'heart')
    expect(JSON.stringify(resources.local)).not.toContain('Private project')
    resources.setWindows([])
    resources.api.windows.onRemoved.emit(1)
    resources.api.windows.onRemoved.emit(2)
    await resources.tracker.settled()
    resources.setWindows([
      sampleWindow(1, ['https://unrelated.test']),
      sampleWindow(2, ['https://private.test'], true),
    ])
    resources.api.windows.onCreated.emit()
    await resources.tracker.settled()
    expect(resources.session[WINDOW_IDENTITIES_KEY]).toEqual({})
    resources.setWindows([sampleWindow(9)])
    resources.api.windows.onCreated.emit()
    await resources.tracker.settled()
    expect(resources.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      9: { name: 'Work' },
    })
  })
  it('reconsiders provisional matches while restored windows gain tabs', async () => {
    const original = setup([
      sampleWindow(1, ['https://a.test']),
      sampleWindow(2, ['https://a.test', 'https://b.test']),
    ])
    await original.edit(1, 'Work')
    await original.edit(2, 'Research')
    const saved = structuredClone(original.local)
    const restored = setup([sampleWindow(10, ['https://a.test'])], saved)
    await vi.advanceTimersByTimeAsync(100)
    expect(restored.local).toEqual(saved)
    restored.setWindows([
      sampleWindow(10, ['https://a.test', 'https://b.test']),
      sampleWindow(20, ['https://a.test']),
    ])
    restored.api.tabs.onCreated.emit()
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Research', provisional: false },
      20: { name: 'Work', provisional: false },
    })
  })
  it('does not assign an ambiguous restored label or save a name for a missing window', async () => {
    const original = setup()
    await original.edit(1, 'Work')
    const restored = setup([sampleWindow(2), sampleWindow(3)], original.local)
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toBeUndefined()
    expect(await restored.edit(99, 'Missing')).toEqual({
      error: 'This window is no longer available.',
    })
  })
})
