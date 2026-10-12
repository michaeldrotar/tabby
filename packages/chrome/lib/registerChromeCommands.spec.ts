import { describe, expect, it, vi } from 'vitest'
import { registerChromeCommands } from './registerChromeCommands.js'

const setup = () => {
  const api = {
    runtime: { onInstalled: { addListener: vi.fn() } },
    commands: { onCommand: { addListener: vi.fn() } },
    windows: {
      getLastFocused: vi.fn(async () => ({ id: 7, incognito: false })),
      getAll: vi.fn(async () => [
        { id: 7, incognito: false },
        { id: 9, incognito: false },
        { id: 11, incognito: true },
      ]),
      update: vi.fn(async () => ({})),
    },
    action: { openPopup: vi.fn(async () => {}) },
    sidePanel: {
      open: vi.fn(async () => {}),
      setPanelBehavior: vi.fn(async () => {}),
    },
  }
  registerChromeCommands(
    api as unknown as Parameters<typeof registerChromeCommands>[0],
  )
  const command = api.commands.onCommand.addListener.mock.calls[0]![0] as (
    command: string,
    tab?: { windowId: number; incognito?: boolean },
  ) => Promise<void>
  return { api, command }
}

describe('Chrome commands', () => {
  it('opens the side panel in the initiating window during the user gesture', async () => {
    const { api, command } = setup()
    const opening = command('open-tab-manager', { windowId: 9 })
    expect(api.sidePanel.open).toHaveBeenCalledWith({ windowId: 9 })
    await opening
  })

  it('reads the current browser focus when the command has no source tab', async () => {
    const { api, command } = setup()
    await command('open-omnibar')
    api.windows.getLastFocused.mockResolvedValueOnce({
      id: 9,
      incognito: false,
    })
    await command('open-omnibar')
    expect(api.action.openPopup.mock.calls).toEqual([
      [{ windowId: 7 }],
      [{ windowId: 9 }],
    ])
  })

  it('keeps numbered window shortcuts within the initiating privacy context', async () => {
    const { api, command } = setup()
    await command('focus-window-01', { windowId: 11, incognito: true })
    expect(api.windows.update).toHaveBeenCalledWith(11, { focused: true })
  })
})
