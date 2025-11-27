import { duckDuckGoBangs } from './data/duckDuckGoBangs'
import type { DuckDuckGoBang } from './DuckDuckGoBang'

const bangMap = new Map<string, DuckDuckGoBang>()
duckDuckGoBangs.forEach((bang) => {
  bangMap.set(bang.t, bang)
})

export const getDuckDuckGoBangByTrigger = (
  trigger: string,
): DuckDuckGoBang | undefined => {
  return bangMap.get(trigger)
}
