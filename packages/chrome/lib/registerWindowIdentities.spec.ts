import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  registerWindowIdentities,
  WINDOW_IDENTITIES_KEY,
  WINDOW_LABELS_KEY,
  WINDOW_RESTORE_ALARM,
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
  tabs: urls.map((url, index) => ({
    id: id * 10 + index,
    windowId: id,
    url,
    status: 'complete',
  })),
})
const setup = (
  initial = [sampleWindow(1)],
  persisted: Record<string, unknown> = {},
  session: Record<string, unknown> = {},
) => {
  vi.useFakeTimers({ toFake: ['Date'] })
  let windows = initial
  const local = structuredClone(persisted)
  const area = (values: Record<string, unknown>) => ({
    get: async (key: string) => ({ [key]: structuredClone(values[key]) }),
    set: async (patch: Record<string, unknown>) =>
      Object.assign(values, structuredClone(patch)),
  })
  const api = {
    alarms: {
      create: vi.fn(async () => {}),
      clear: vi.fn(async () => true),
      onAlarm: event(),
    },
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
    tracker,
    confirm: async () => {
      vi.setSystemTime(Date.now() + 31_000)
      api.alarms.onAlarm.emit({ name: WINDOW_RESTORE_ALARM })
      await tracker.settled()
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
    restarted.api.tabs.onUpdated.emit()
    await restarted.tracker.settled()
    expect(restarted.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      88: { name: '' },
    })
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
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: true },
    })
    await restored.confirm()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: true },
    })
    expect(restored.local).toEqual(saved)
    restored.setWindows([
      sampleWindow(10, ['https://a.test', 'https://b.test']),
      sampleWindow(20, ['https://a.test']),
    ])
    restored.api.tabs.onCreated.emit()
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Research', provisional: true },
      20: { name: 'Work', provisional: true },
    })
    expect(restored.local).toEqual(saved)
    await restored.confirm()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Research', provisional: false },
      20: { name: 'Work', provisional: false },
    })
  })
  it('does not assign an ambiguous restored label or save a name for a missing window', async () => {
    const original = setup()
    await original.edit(1, 'Work')
    for (const record of original.local[WINDOW_LABELS_KEY] as {
      position?: number
    }[])
      delete record.position
    const restored = setup([sampleWindow(2), sampleWindow(3)], original.local)
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toBeUndefined()
    expect(await restored.edit(99, 'Missing')).toEqual({
      error: 'This window is no longer available.',
    })
  })

  it('shows partial matches during loading without changing saved fingerprints, and survives worker restarts', async () => {
    const urls = Array.from(
      { length: 20 },
      (_, index) => `https://work.test/${index}`,
    )
    const original = setup([
      sampleWindow(1, urls),
      sampleWindow(2, ['https://other.test']),
    ])
    await original.edit(1, 'Work')
    await original.edit(2, 'Other')
    const loading = sampleWindow(20, ['https://other.test'])
    loading.tabs[0]!.status = 'loading'
    const restored = setup(
      [sampleWindow(10, urls.slice(0, 2)), loading],
      original.local,
    )
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: true },
      20: { name: 'Other', provisional: true },
    })
    await restored.confirm()
    expect(restored.local).toEqual(original.local)
    const restarted = setup(
      [sampleWindow(10, urls), loading],
      restored.local,
      restored.session,
    )
    await restarted.tracker.settled()
    await restarted.confirm()
    expect(restarted.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: false },
      20: { name: 'Other', provisional: true },
    })
    expect(
      (
        restarted.local[WINDOW_LABELS_KEY] as {
          name: string
          hashes: string[]
        }[]
      ).find((record) => record.name === 'Work')!.hashes,
    ).toHaveLength(20)
  })

  it('keeps explicit edits authoritative and saves order through windows closing', async () => {
    const original = setup([
      sampleWindow(1),
      sampleWindow(2, ['https://other.test']),
    ])
    await original.edit(1, 'Work')
    await original.edit(2, 'Other')
    original.setWindows([sampleWindow(2, ['https://other.test'])])
    original.api.windows.onRemoved.emit(1)
    await original.tracker.settled()
    expect(original.local[WINDOW_LABELS_KEY]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Other', position: 1 }),
      ]),
    )
    const restored = setup([sampleWindow(10)], original.local)
    await restored.tracker.settled()
    await restored.edit(10, 'My choice', 'book')
    restored.setWindows([
      sampleWindow(10, ['https://other.test']),
      sampleWindow(20),
    ])
    restored.api.windows.onCreated.emit()
    await restored.confirm()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'My choice', icon: 'book' },
    })
    expect(JSON.stringify(restored.session)).not.toContain('"name":"Work"')
  })

  it('keeps incomplete guesses reversible past the quiet period and respects reset', async () => {
    const work = ['a', 'b', 'c', 'd', 'e'].map(
      (path) => `https://work.test/${path}`,
    )
    const research = [...work.slice(0, 4), 'https://work.test/f']
    const original = setup([sampleWindow(1, work), sampleWindow(2, research)])
    await original.edit(1, 'Work')
    await original.edit(2, 'Research')
    const restored = setup([sampleWindow(10, work.slice(0, 4))], original.local)
    await restored.tracker.settled()
    await restored.confirm()
    expect(restored.local).toEqual(original.local)
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: true },
    })
    restored.setWindows([sampleWindow(10, research), sampleWindow(20, work)])
    restored.api.tabs.onCreated.emit()
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Research' },
      20: { name: 'Work' },
    })

    const reset = setup([sampleWindow(10, work.slice(0, 4))], original.local)
    await reset.tracker.settled()
    await reset.edit(10, '')
    reset.api.tabs.onUpdated.emit()
    await reset.confirm()
    expect(reset.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: '' },
    })
  })

  it('restores names in order after an earlier window closes and a new one is named', async () => {
    const original = setup([
      sampleWindow(1, ['https://unnamed.test']),
      sampleWindow(2),
    ])
    await original.edit(2, 'Work')
    original.setWindows([sampleWindow(2), sampleWindow(3)])
    original.api.windows.onRemoved.emit(1)
    original.api.windows.onCreated.emit()
    await original.edit(3, 'Research')
    const restored = setup([sampleWindow(10), sampleWindow(20)], original.local)
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work' },
      20: { name: 'Research' },
    })
  })

  it('releases unrelated partial guesses and starts a new quiet period if their tabs return', async () => {
    const urls = ['a', 'b', 'c', 'd'].map((path) => `https://work.test/${path}`)
    const original = setup([sampleWindow(1, urls)])
    await original.edit(1, 'Work')
    const restored = setup([sampleWindow(10, urls.slice(0, 2))], original.local)
    await restored.tracker.settled()
    vi.setSystemTime(Date.now() + 20_000)
    restored.setWindows([
      sampleWindow(10, ['https://x.test', 'https://y.test']),
    ])
    restored.api.tabs.onUpdated.emit()
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toEqual({})
    vi.setSystemTime(Date.now() + 20_000)
    restored.setWindows([sampleWindow(10, urls)])
    restored.api.tabs.onUpdated.emit()
    await restored.tracker.settled()
    restored.api.alarms.onAlarm.emit({ name: WINDOW_RESTORE_ALARM })
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: true },
    })
    expect(restored.local).toEqual(original.local)
    await restored.confirm()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: false },
    })
  })

  it('keeps a fully recognized name while browsing during confirmation and saves the live fingerprint', async () => {
    const urls = ['a', 'b', 'c', 'd', 'e'].map(
      (path) => `https://work.test/${path}`,
    )
    const original = setup([sampleWindow(1, urls)])
    await original.edit(1, 'Work')
    const restored = setup([sampleWindow(10, urls)], original.local)
    await restored.tracker.settled()
    const browsed = ['https://new.test', ...urls.slice(1), 'https://extra.test']
    restored.setWindows([sampleWindow(10, browsed)])
    restored.api.tabs.onCreated.emit()
    await restored.tracker.settled()
    expect(restored.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work' },
    })
    expect(restored.local).toEqual(original.local)
    const workerRestarted = setup(
      [sampleWindow(10, browsed)],
      restored.local,
      restored.session,
    )
    await workerRestarted.tracker.settled()
    await workerRestarted.confirm()
    expect(workerRestarted.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      10: { name: 'Work', provisional: false },
    })
    expect(
      (workerRestarted.local[WINDOW_LABELS_KEY] as { hashes: string[] }[])[0]!
        .hashes,
    ).toHaveLength(browsed.length)
    const nextUrls = ['https://next.test/one', 'https://next.test/two']
    workerRestarted.setWindows([sampleWindow(10, nextUrls)])
    workerRestarted.api.tabs.onUpdated.emit()
    await workerRestarted.tracker.settled()
    const browserRestarted = setup(
      [sampleWindow(20, nextUrls)],
      workerRestarted.local,
    )
    await browserRestarted.tracker.settled()
    expect(browserRestarted.session[WINDOW_IDENTITIES_KEY]).toMatchObject({
      20: { name: 'Work' },
    })
  })
})
