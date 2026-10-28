import { describe, expect, it, vi } from 'vitest'
import { createChromeRecentlyClosedResource } from './createChromeRecentlyClosedResource.js'

const sessions = [
  { lastModified: 10, tab: { sessionId: 'tab', title: 'Single tab' } },
  {
    lastModified: 9,
    window: {
      sessionId: 'window',
      tabs: [
        { title: 'Research', url: 'https://example.com' },
        { url: 'https://tabby.test' },
      ],
    },
  },
  { lastModified: 8, window: { tabs: [] } },
]
const setup = () => {
  const listeners = new Set<() => void>()
  const api = {
    runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
    sessions: {
      getRecentlyClosed: vi.fn(async () => sessions),
      restore: vi.fn(async (_id: string) => ({})),
      onChanged: {
        addListener: (fn: () => void) => listeners.add(fn),
        removeListener: (fn: () => void) => listeners.delete(fn),
      },
    },
  }
  const resource = createChromeRecentlyClosedResource(
    api as unknown as Parameters<typeof createChromeRecentlyClosedResource>[0],
  )
  return { resource, api, listeners }
}

describe('recently closed sessions', () => {
  it('loads native entries, restores the chosen window once, and refreshes on events and restoration', async () => {
    const { resource, api, listeners } = setup()
    expect(resource.getSnapshot().status).toBe('loading')
    await resource.start()
    expect(resource.getSnapshot().sessions).toMatchObject([
      { kind: 'tab', sessionId: 'tab', closedAt: 10000 },
      {
        kind: 'window',
        sessionId: 'window',
        closedAt: 9000,
        tabs: [{ title: 'Research' }, { title: 'https://tabby.test' }],
      },
    ])
    let finish!: () => void
    api.sessions.restore.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({})
        }),
    )
    api.sessions.getRecentlyClosed.mockResolvedValue([sessions[0]!])
    const restoring = resource.restore('window')
    await resource.restore('window')
    expect(resource.getSnapshot().restoringSessionId).toBe('window')
    finish()
    await restoring
    expect(api.sessions.restore.mock.calls).toEqual([['window']])
    expect(resource.getSnapshot().sessions).toHaveLength(1)
    api.sessions.getRecentlyClosed.mockResolvedValue([])
    listeners.forEach((listener) => listener())
    await vi.waitFor(() => expect(resource.getSnapshot().sessions).toEqual([]))
    resource.dispose()
    expect(listeners.size).toBe(0)
  })

  it('handles load failures, retry, and expired sessions without restoring the newest item', async () => {
    const { resource, api } = setup()
    api.sessions.getRecentlyClosed.mockRejectedValueOnce(
      new Error('Unavailable'),
    )
    await resource.start()
    expect(resource.getSnapshot()).toMatchObject({
      status: 'error',
      error: expect.stringContaining('Could not load'),
    })
    await resource.refresh()
    expect(resource.getSnapshot()).toMatchObject({
      status: 'ready',
      error: undefined,
    })
    api.sessions.restore.mockRejectedValueOnce(new Error('Invalid session ID'))
    api.sessions.getRecentlyClosed.mockResolvedValue([])
    await resource.restore('expired')
    expect(resource.getSnapshot()).toMatchObject({
      status: 'ready',
      sessions: [],
      error: expect.stringContaining('no longer be available'),
      restoringSessionId: undefined,
    })
    expect(api.sessions.restore.mock.calls).toEqual([['expired']])
  })

  it('ignores stale refreshes and loading that finishes after disposal', async () => {
    const { resource, api } = setup()
    let finish!: (value: typeof sessions) => void
    api.sessions.getRecentlyClosed.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const loading = resource.start()
    api.sessions.getRecentlyClosed.mockResolvedValue([])
    await resource.refresh()
    finish(sessions)
    await loading
    expect(resource.getSnapshot().sessions).toEqual([])
    api.sessions.getRecentlyClosed.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = resource.refresh()
    const previous = resource.getSnapshot()
    resource.dispose()
    finish(sessions)
    await pending
    expect(resource.getSnapshot()).toBe(previous)
  })
})
