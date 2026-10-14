import face from '../../../product/brand/tabby-face.png'
import paws from '../../../product/brand/tabby-paws.png'

export const assets = { face, paws }
export const storeUrl =
  'https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob'

export const homeFeatures = [
  {
    id: 'manage',
    label: 'Manage tabs',
    description:
      'A project here. Weekend plans there. Keep all your windows in view, and move, group, pin, or close a few tabs together when it’s time to tidy up.',
  },
  {
    id: 'find',
    label: 'Find anything',
    description:
      'A page shouldn’t be hard to find just because it’s in another window. I know that feeling: it’s open somewhere, but there are so many windows and tabs. Tabby searches them all at once, along with bookmarks, history, recently closed pages, and anywhere else it may be hiding!',
  },
  {
    id: 'customize',
    label: 'Make it yours',
    description:
      'I’ve given Tabby some simple but powerful color options so it can all feel at home in your browser.',
  },
] as const

export type HomeFeatureId = (typeof homeFeatures)[number]['id']
