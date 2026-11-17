import { beforeEach, expect, it, vi } from 'vitest'
import { registerClosingWindowMoves } from './registerClosingWindowMoves.js'

const { backend, host } = vi.hoisted(() => ({
  backend: {
    start: vi.fn(),
    dispose: vi.fn(),
    getSnapshot: vi.fn(),
    execute: vi.fn(),
  },
  host: {
    start: vi.fn(),
    dispose: vi.fn(),
    capabilities: { openWindowTabManager: vi.fn() },
  },
}))
vi.mock('./createChromeBackend.js', () => ({
  createChromeBackend: () => backend,
}))
vi.mock('./createChromeTabManagerHost.js', () => ({
  createChromeTabManagerHost: () => host,
}))
beforeEach(() => vi.resetAllMocks())

it.each([
  { follow: false, group: false },
  { follow: true, group: false },
  { follow: true, group: true },
])(
  'honors follow=$follow for delegated group=$group transfers',
  async ({ follow, group }) => {
    const command = group
      ? { type: 'group-tabs', tabIds: [11], groupId: 6, follow }
      : { type: 'move-tabs', tabIds: [11], windowId: 2, follow }
    const outcome = {
      status: 'success',
      requestedIds: [11],
      succeededIds: [11],
      failures: [],
    }
    backend.getSnapshot
      .mockReturnValueOnce({ tabs: [{ id: 11, windowId: 1 }], groups: [] })
      .mockReturnValue({ tabs: [{ id: 11, windowId: 2 }], groups: [] })
    backend.execute.mockResolvedValue(outcome)
    const addListener = vi.fn()
    registerClosingWindowMoves({
      runtime: { id: 'tabby', onMessage: { addListener } },
    } as unknown as typeof chrome)
    const response = new Promise((resolve) => {
      expect(
        addListener.mock.calls[0]![0](
          { type: 'tabby-move-from-closing-window', command },
          { id: 'tabby' },
          resolve,
        ),
      ).toBe(true)
    })
    expect(await response).toEqual({ outcome })
    expect(backend.execute).toHaveBeenCalledWith(command)
    if (follow) {
      expect(host.capabilities.openWindowTabManager).toHaveBeenCalledWith(
        2,
        [11],
      )
      expect(backend.execute).toHaveBeenCalledWith({
        type: 'activate-tab',
        tabId: 11,
        preserveWindowPlacement: true,
      })
    } else {
      expect(host.capabilities.openWindowTabManager).not.toHaveBeenCalled()
      expect(backend.execute).toHaveBeenCalledExactlyOnceWith(command)
    }
  },
)
