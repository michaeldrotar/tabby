import type { OmnibarActionModifier } from '@/lib/omnibar/actions/OmnibarActionModifier'

export type OmnibarActionFn = (
  modifier?: OmnibarActionModifier,
  parentWindowId?: number,
) => Promise<void>
