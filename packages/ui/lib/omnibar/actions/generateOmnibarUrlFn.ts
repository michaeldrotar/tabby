import { executeUrl } from '../executeUrl'
import type { OmnibarActionFn } from '@/lib/omnibar/actions/OmnibarActionFn'

export const generateOmnibarUrlFn = (url: string): OmnibarActionFn => {
  return async (modifier, parentWindowId) => {
    await executeUrl(url, modifier, parentWindowId)
  }
}
