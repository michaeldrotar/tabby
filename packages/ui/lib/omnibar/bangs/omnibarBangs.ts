import { duckDuckGoBangs } from './data/duckDuckGoBangs'
import type { OmnibarBang } from './OmnibarBang'

export const omnibarBangs: OmnibarBang[] = [
  ...duckDuckGoBangs.map((bang) => {
    return {
      trigger: `!${bang.t}`,
      siteName: bang.s,
      domain: bang.d,
      searchTemplate: bang.u,
    }
  }),
]
