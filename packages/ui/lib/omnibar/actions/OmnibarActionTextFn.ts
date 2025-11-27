import type { OmnibarActionModifier } from '@/lib/omnibar/actions/OmnibarActionModifier'

export type OmnibarActionTextFn = (modifier?: OmnibarActionModifier) => {
  primaryText: string
  secondaryText?: string
}
