import type { OmnibarModifier, OmnibarResult } from '@extension/core'

export type OmnibarSearchResult = Omit<OmnibarResult, 'action'> & {
  execute: (
    modifier?: OmnibarModifier,
    originalWindowId?: number,
  ) => Promise<void>
}
