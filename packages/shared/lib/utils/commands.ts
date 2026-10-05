export const TABBY_COMMANDS = {
  openOmnibar: 'open-omnibar',
  openTabManager: 'open-tab-manager',
} as const

export type TabbyCommand = (typeof TABBY_COMMANDS)[keyof typeof TABBY_COMMANDS]
