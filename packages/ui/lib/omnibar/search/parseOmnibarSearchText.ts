import { tokenizeOmnibarText } from './tokenizeOmnibarText'
import { getOmnibarBangByTrigger } from '../bangs/getOmnibarBangByTrigger'
import type { OmnibarSearchQuery } from './OmnibarSearchQuery'
import type { OmnibarBang } from '../bangs/OmnibarBang'

const findBang = (tokens: string[]): OmnibarBang | undefined => {
  for (const token in tokens) {
    const bang = getOmnibarBangByTrigger(token)
    if (bang) {
      return bang
    }
  }
  return undefined
}

const detectBangText = (tokens: string[]): string | undefined => {
  if (tokens.length === 1) {
    const token = tokens[0]
    if (token[0] === '!' && token.length > 1) {
      return token
    }
  }

  return undefined
}

export const parseOmnibarSearchText = (
  searchText: string,
): OmnibarSearchQuery => {
  const trimmedSearchText = searchText.trim()
  const tokens = tokenizeOmnibarText(trimmedSearchText)

  const potentialBangText = detectBangText(tokens)
  const activeBang = findBang(tokens)
  const activeBangTokens = activeBang
    ? tokens.filter((token) => token !== activeBang.trigger)
    : undefined

  // If there's just `!w`, show potential bangs but do also show wikipedia domain matches
  return {
    searchText: trimmedSearchText,
    potentialBangText,
    activeBang,
    activeBangTokens,
    tokens,
  }
}
