import { promoTab } from '../components/PromoTabManager'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/Omnibar'

const execute = async () => undefined

export const overviewFeaturedTab = promoTab(
  101,
  'Design system',
  'figma.com/design/system',
  { active: true },
)

const overviewBookmarkTab = promoTab(
  102,
  'Design references',
  'developer.mozilla.org/en-US/docs/Web/CSS',
)
const overviewClosedTab = promoTab(
  103,
  'Color palette exploration',
  'figma.com/file/colors',
)
const overviewHistoryTab = promoTab(
  104,
  'Design review notes',
  'docs.google.com/document/design-review',
)

const resultFromTab = (
  id: string,
  type: OmnibarSearchResult['type'],
  tab: ReturnType<typeof promoTab>,
  ageLabel?: string,
): OmnibarSearchResult => ({
  id,
  type,
  title: tab.title ?? '',
  url: tab.url,
  favIconUrl: tab.faviconUrl,
  ageLabel,
  execute,
})

export const overviewResults: OmnibarSearchResult[] = [
  {
    id: 'design-search',
    type: 'search',
    title: 'Search Google',
    url: 'https://www.google.com/search?q=design',
    execute,
  },
  resultFromTab('design-system-tab', 'tab', overviewFeaturedTab),
  resultFromTab('design-bookmark', 'bookmark', overviewBookmarkTab),
  resultFromTab('design-closed', 'recently-closed', overviewClosedTab, '5m'),
  resultFromTab('design-history', 'history', overviewHistoryTab, '1h'),
]
