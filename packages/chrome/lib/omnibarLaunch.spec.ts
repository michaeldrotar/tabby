import { describe, expect, it, vi } from 'vitest'
import { openWindowSearch, takeSearchScope } from './omnibarLaunch.js'

const setup = () => {
  const stored: Record<string, unknown> = {}
  const session = {
    get: async (key: string) => ({ [key]: stored[key] }),
    set: async (values: Record<string, unknown>) => {
      Object.assign(stored, values)
    },
    remove: async (key: string) => {
      delete stored[key]
    },
  } as unknown as typeof chrome.storage.session
  const api = {
    storage: { session },
    action: { openPopup: vi.fn(async () => {}) },
  }
  return { api, session, stored }
}

describe('Window search launch', () => {
  it('scopes only the next search in the originating window', async () => {
    const { api, session } = setup()
    await openWindowSearch(api, 3)
    expect(api.action.openPopup).toHaveBeenCalledWith({ windowId: 3 })
    expect(await takeSearchScope(session, 4)).toBeUndefined()
    expect(await takeSearchScope(session, 3)).toBe('current-window')
    expect(await takeSearchScope(session, 3)).toBeUndefined()
  })

  it('discards expired launches and cleans up a popup that fails to open', async () => {
    const { api, session, stored } = setup()
    stored['tabby-search-launch-3'] = Date.now() - 11_000
    expect(await takeSearchScope(session, 3)).toBeUndefined()
    api.action.openPopup.mockRejectedValueOnce(new Error('Cannot open popup'))
    await expect(openWindowSearch(api, 3)).rejects.toThrow('Cannot open popup')
    expect(await takeSearchScope(session, 3)).toBeUndefined()
  })
})
