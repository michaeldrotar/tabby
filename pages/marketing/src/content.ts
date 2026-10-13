import face from '../../../product/brand/tabby-face.png'
import paws from '../../../product/brand/tabby-paws.png'
import overview from '../../../product/promotional-assets/screenshots/01-overview.jpg'
import search from '../../../product/promotional-assets/screenshots/02-find-anything.jpg'
import themes from '../../../product/promotional-assets/screenshots/03-themes.jpg'
import bulk from '../../../product/promotional-assets/screenshots/05-bulk-actions.jpg'

export const assets = { face, paws, overview, search, themes, bulk }
export const storeUrl =
  'https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob'
export type Design = 'companion' | 'focus' | 'playground'
export const features = [
  {
    id: 'manage',
    label: 'Manage tabs',
    title: 'Every window. A clearer view.',
    description:
      'Work, weekend plans, that article for later. See your windows and tab groups in one side panel, and jump straight to what matters.',
    image: overview,
    alt: 'Tabby side panel showing three windows beside search results for design',
    detail: 'Keep the big picture beside your current page.',
  },
  {
    id: 'find',
    label: 'Find anything',
    title: '“I know I had that page somewhere.”',
    description:
      'Search open tabs, tab groups, bookmarks, browsing history, and recently closed pages in one place. A few letters get you back on track.',
    image: search,
    alt: 'Tabby search finding an open tab, bookmark, recently closed page, and history result',
    detail: 'One search for the places you have already been.',
  },
  {
    id: 'bulk',
    label: 'Work in batches',
    title: 'A whole project. One selection.',
    description:
      'Select tabs across windows, then move, group, pin, reload, copy, discard, or close them together. Get the tidying done and get on with your day.',
    image: bulk,
    alt: 'Tabby showing a batch selection, its actions menu, and the resulting discarded tabs',
    detail: 'Less repetition. More room for the next thing.',
  },
  {
    id: 'customize',
    label: 'Make it yours',
    title: 'Your browser should feel like you.',
    description:
      'Choose light or dark, pick your accent, and tune your colors. Tabby brings the same comfortable look to search and your tab manager.',
    image: themes,
    alt: 'Tabby appearance examples in light and dark themes with a range of accent colors',
    detail: 'A quieter look or a little color. Your call.',
  },
] as const
