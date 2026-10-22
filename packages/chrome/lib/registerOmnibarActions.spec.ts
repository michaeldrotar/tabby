import { describe, expect, it, vi } from 'vitest'
import { createChromeOmnibarResource } from './createChromeOmnibarResource.js'
import {
  loadChromeOmnibarChoices,
  OMNIBAR_CHOICES_KEY,
  OMNIBAR_PRIVATE_CHOICES_KEY,
} from './omnibarChoices.js'
import { registerOmnibarActions } from './registerOmnibarActions.js'
import type { ChromeOmnibarApi } from './createChromeOmnibarResource.js'
import type { OmnibarChoice } from '@extension/core'

const setup = () => {
  const area = () => {
    const values: Record<string, unknown> = {}
    return {
      values,
      get: vi.fn(async (key: string) => ({ [key]: values[key] })),
      set: vi.fn(async (next: Record<string, unknown>) => {
        Object.assign(values, next)
      }),
      remove: vi.fn(async (key: string) => {
        delete values[key]
      }),
    }
  }
  let listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0]
  const api = {
    storage: { local: area(), session: area() },
    windows: {
      get: vi.fn(async (id: number) => ({ id, incognito: id === 2 })),
      getLastFocused: vi.fn(async () => ({ id: 1, incognito: false })),
      update: vi.fn(async () => ({})),
      create: vi.fn(async () => ({})),
    },
    tabs: {
      update: vi.fn(async () => ({})),
      query: vi.fn(async () => [{ id: 5, index: 0 }]),
      create: vi.fn(async () => ({})),
    },
    tabGroups: {
      query: vi.fn(async () => [{ id: 4, windowId: 1 }]),
      update: vi.fn(async () => ({})),
    },
    sessions: { restore: vi.fn(async () => ({})) },
    commands: { getAll: vi.fn(async () => []) },
    runtime: {
      id: 'test',
      onMessage: {
        addListener: (next: typeof listener) => {
          listener = next
        },
      },
      getPlatformInfo: vi.fn(async () => ({ os: 'mac' })),
      openOptionsPage: vi.fn(async () => {}),
      sendMessage: vi.fn(
        (message: unknown) =>
          new Promise((resolve) => {
            listener(message, { id: 'test' }, resolve)
          }),
      ),
      getURL: (path: string) => path,
    },
    sidePanel: { open: vi.fn(async () => {}) },
  }
  registerOmnibarActions(api as unknown as typeof chrome)
  const resource = (id = 1) =>
    createChromeOmnibarResource(api as unknown as ChromeOmnibarApi, id)
  const choice = (target: string): OmnibarChoice => ({
    query: 'cat',
    target,
    selectedAt: Date.now(),
  })
  return { api, resource, choice }
}

describe('Worker-owned omnibar choices', () => {
  it('records a window choice after popup disposal and reloads it on reopening', async () => {
    const { api, resource, choice } = setup()
    const popup = resource()
    await popup.start()
    api.windows.update.mockImplementationOnce(async () => {
      popup.dispose()
      return {}
    })
    await expect(
      popup.execute(
        { kind: 'window', windowId: 3 },
        undefined,
        choice('window:3'),
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
    const reopened = resource()
    await reopened.start()
    expect(reopened.getSnapshot().choices).toEqual([
      expect.objectContaining({ query: 'cat', target: 'window:3' }),
    ])
    expect(api.storage.local.values[OMNIBAR_CHOICES_KEY]).toBeUndefined()
    expect(api.storage.session.values[OMNIBAR_CHOICES_KEY]).toHaveLength(1)
  })
  it('persists multiple choices for a query and ignores failed navigation', async () => {
    const { api, resource, choice } = setup()
    const popup = resource()
    await popup.start()
    await popup.execute(
      { kind: 'options' },
      undefined,
      choice('command:options'),
    )
    expect(api.storage.local.values[OMNIBAR_CHOICES_KEY]).toEqual([
      expect.objectContaining({ target: 'command:options' }),
    ])
    await popup.saveQuery('retry')
    api.windows.update.mockRejectedValueOnce(new Error('Window closed'))
    await expect(
      popup.execute(
        { kind: 'window', windowId: 3 },
        undefined,
        choice('window:3'),
      ),
    ).rejects.toThrow('Window closed')
    expect(popup.getSnapshot().choices?.[0]?.target).toBe('command:options')
    expect(api.storage.local.values.lastQuery).toBe('retry')
    await popup.execute(
      { kind: 'tab', tabId: 5, windowId: 1 },
      undefined,
      choice('tab:5'),
    )
    expect(popup.getSnapshot().choices?.map((item) => item.target)).toEqual([
      'tab:5',
      'command:options',
    ])
  })
  it('isolates private choices in session storage and tolerates unavailable storage', async () => {
    const { api, resource, choice } = setup()
    const regular = resource(1),
      privatePopup = resource(2)
    await Promise.all([regular.start(), privatePopup.start()])
    await regular.execute(
      { kind: 'options' },
      undefined,
      choice('command:options'),
    )
    await privatePopup.execute(
      { kind: 'options' },
      undefined,
      choice('command:private-options'),
    )
    expect(
      await loadChromeOmnibarChoices(api as unknown as ChromeOmnibarApi, 1),
    ).toEqual([expect.objectContaining({ target: 'command:options' })])
    expect(
      await loadChromeOmnibarChoices(api as unknown as ChromeOmnibarApi, 2),
    ).toEqual([expect.objectContaining({ target: 'command:private-options' })])
    expect(
      api.storage.local.values[OMNIBAR_PRIVATE_CHOICES_KEY],
    ).toBeUndefined()
    expect(
      api.storage.session.values[OMNIBAR_PRIVATE_CHOICES_KEY],
    ).toHaveLength(1)
    api.storage.session.set.mockRejectedValueOnce(
      new Error('Storage unavailable'),
    )
    await expect(
      privatePopup.execute(
        { kind: 'window', windowId: 4 },
        undefined,
        choice('window:4'),
      ),
    ).resolves.toBeUndefined()
  })
  it('starts side-panel opening within the incoming message gesture', async () => {
    const { api, choice } = setup()
    const opening = api.runtime.sendMessage({
      type: 'tabby-omnibar-execute',
      windowId: 1,
      action: { kind: 'tab-manager' },
      choice: choice('command:tab-manager'),
    })
    expect(api.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 })
    await expect(opening).resolves.toEqual({ success: true })
  })
})
