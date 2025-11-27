import { omnibarBangs } from './omnibarBangs'
import type { OmnibarBang } from './OmnibarBang'

export const searchOmnibarBangs = (query: string): OmnibarBang[] => {
  // Find the last term that starts with !
  const terms = query.split(' ')
  const bangTerm = terms.reverse().find((term) => term.startsWith('!'))

  if (!bangTerm) return []

  const trigger = bangTerm.slice(1).toLowerCase()

  // If just "!", return top 5 ranked bangs
  // if (!trigger) {
  //   return duckDuckGoBangs.sort((a, b) => (b.r || 0) - (a.r || 0)).slice(0, 5)
  // }

  return omnibarBangs.filter((b) => b.trigger.startsWith(trigger))
  // .sort((a, b) => (b.r || 0) - (a.r || 0))
  // .slice(0, 5)
}
