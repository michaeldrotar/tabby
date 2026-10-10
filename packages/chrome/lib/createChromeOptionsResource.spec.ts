import { describe, expect, it, vi } from 'vitest'
import { createChromeOptionsResource } from './createChromeOptionsResource.js'

describe('Chrome options metadata', () => {
  it('loads platform and shortcuts, routes settings, and ignores disposed loading', async () => {
    const api = {
      runtime: {
        getURL: (path: string) => `chrome-extension://tabby/${path}`,
        getPlatformInfo: vi.fn(async () => ({ os: 'mac' })),
      },
      commands: {
        getAll: vi.fn(async () => [
          { name: 'open-omnibar', shortcut: 'Command+E' },
        ]),
      },
      tabs: { create: vi.fn(async () => ({})) },
    }
    const resource = createChromeOptionsResource(
      api as unknown as Parameters<typeof createChromeOptionsResource>[0],
    )
    await resource.start()
    expect(resource.getSnapshot()).toMatchObject({
      status: 'ready',
      isMac: true,
      shortcuts: { 'open-omnibar': 'Command+E' },
    })
    await resource.openShortcutsSettings()
    await resource.openSidePanelSettings()
    expect(api.tabs.create.mock.calls).toEqual([
      [{ url: 'chrome://extensions/shortcuts' }],
      [{ url: 'chrome://settings/appearance' }],
    ])
    resource.dispose()
    let finish!: (value: { os: string }) => void
    api.runtime.getPlatformInfo.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const loading = resource.start()
    const previous = resource.getSnapshot()
    resource.dispose()
    finish({ os: 'win' })
    await loading
    expect(resource.getSnapshot()).toBe(previous)
  })
})
