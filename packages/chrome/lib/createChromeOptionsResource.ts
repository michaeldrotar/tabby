import type { OptionsMetadata, OptionsResource } from '@extension/core/options'

export const createChromeOptionsResource = (
  api: Pick<typeof chrome, 'commands' | 'runtime' | 'tabs'>,
): OptionsResource => {
  let snapshot: OptionsMetadata = {
    status: 'loading',
    isMac: false,
    logoUrl: api.runtime.getURL('tabby-face.png'),
    shortcuts: {},
  }
  let generation = 0
  let task: Promise<void> | undefined
  const listeners = new Set<() => void>()
  const publish = (next: OptionsMetadata) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: () => {
      if (task) return task
      const operation = ++generation
      task = Promise.all([api.runtime.getPlatformInfo(), api.commands.getAll()])
        .then(([platform, commands]) => {
          if (operation !== generation) return
          publish({
            ...snapshot,
            status: 'ready',
            error: undefined,
            isMac: platform.os === 'mac',
            shortcuts: Object.fromEntries(
              commands.map((command) => [
                command.name ?? '',
                command.shortcut || undefined,
              ]),
            ),
          })
        })
        .catch((error: unknown) => {
          if (operation === generation) {
            task = undefined
            publish({
              ...snapshot,
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
            })
          }
        })
      return task
    },
    dispose: () => {
      generation++
      task = undefined
      listeners.clear()
    },
    openShortcutsSettings: async () => {
      await api.tabs.create({ url: 'chrome://extensions/shortcuts' })
    },
    openSidePanelSettings: async () => {
      await api.tabs.create({ url: 'chrome://settings/appearance' })
    },
  }
}
