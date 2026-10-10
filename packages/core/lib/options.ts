export type OptionsMetadata = {
  status: 'loading' | 'ready' | 'error'
  isMac: boolean
  logoUrl: string
  shortcuts: Readonly<Record<string, string | undefined>>
  error?: string
}

export interface OptionsResource {
  getSnapshot: () => OptionsMetadata
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  openShortcutsSettings: () => Promise<void>
  openSidePanelSettings: () => Promise<void>
}
