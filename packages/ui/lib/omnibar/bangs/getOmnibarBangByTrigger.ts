import { omnibarBangs } from './omnibarBangs'
import type { OmnibarBang } from './OmnibarBang'

const bangMap = new Map<string, OmnibarBang>()
omnibarBangs.forEach((bang) => {
  bangMap.set(bang.trigger, bang)
})

export const getOmnibarBangByTrigger = (
  trigger: string,
): OmnibarBang | undefined => {
  return bangMap.get(trigger)
}
