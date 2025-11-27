import { memoize } from '@extension/shared'
import type { OmnibarActionModifier } from './OmnibarActionModifier'
import type { OmnibarActionTextFn } from './OmnibarActionTextFn'

const getSecondaryText = (
  modifier: OmnibarActionModifier | undefined,
): string | undefined => {
  if (modifier === 'new-tab') {
    return 'in New Tab'
  }
  if (modifier === 'new-window') {
    return 'in New Window'
  }
  return undefined
}

export const generateOmnibarActionTextFn = memoize(
  (primaryText: string): OmnibarActionTextFn => {
    return (modifier) => {
      return {
        primaryText,
        secondaryText: getSecondaryText(modifier),
      }
    }
  },
)
