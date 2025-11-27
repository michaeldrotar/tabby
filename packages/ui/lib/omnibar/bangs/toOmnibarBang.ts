import type { DuckDuckGoBang } from './DuckDuckGoBang'
import type { OmnibarBang } from './OmnibarBang'

export const toOmnibarBang = (
  bang: DuckDuckGoBang,
  additionalData: Omit<
    OmnibarBang,
    'trigger' | 'siteName' | 'domain' | 'searchTemplate'
  >,
): OmnibarBang => {
  return {
    trigger: `!${bang.t}`,
    siteName: bang.s,
    domain: bang.d,
    searchTemplate: bang.u,
    ...additionalData,
  }
}
