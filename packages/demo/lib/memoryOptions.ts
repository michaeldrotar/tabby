import type { OptionsMetadata, OptionsResource } from '@extension/core/options'

export const createMemoryOptionsResource = (
  initial: Partial<OptionsMetadata> = {},
  host: Partial<
    Pick<OptionsResource, 'openShortcutsSettings' | 'openSidePanelSettings'>
  > = {},
): OptionsResource => {
  const snapshot: OptionsMetadata = {
    status: 'ready',
    isMac: false,
    logoUrl: '',
    shortcuts: {},
    ...initial,
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    start: async () => {},
    dispose: () => {},
    openShortcutsSettings: host.openShortcutsSettings ?? (async () => {}),
    openSidePanelSettings: host.openSidePanelSettings ?? (async () => {}),
  }
}
