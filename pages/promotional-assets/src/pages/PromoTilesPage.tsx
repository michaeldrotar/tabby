import { PromoFrame } from '../components/PromoFrame'
import { PromoOmnibar } from '../components/PromoOmnibar'
import {
  promoManagerModel,
  promoTab,
  PromoTabManager,
  promoWindow,
} from '../components/PromoTabManager'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'
import { findAnythingResults } from '../data/findAnythingResults'

const tileWindows = [
  promoWindow(
    1,
    'Product work',
    [
      promoTab(1001, 'Product brief', 'notion.so/product-brief', {
        active: true,
      }),
      promoTab(1002, 'Design system', 'figma.com/design/system'),
      promoTab(1003, 'Launch checklist', 'github.com/tabby/launch'),
      promoTab(1004, 'Team inbox', 'mail.google.com/mail/inbox'),
    ],
    { active: true },
  ),
  promoWindow(2, 'Research', [
    promoTab(1011, 'Research notes', 'docs.google.com/document/research'),
    promoTab(1012, 'Reference library', 'developer.mozilla.org'),
  ]),
  promoWindow(3, 'Reading list', [
    promoTab(1021, 'The creative act', 'read.amazon.com'),
    promoTab(1022, 'Browser patterns', 'web.dev'),
  ]),
  promoWindow(4, 'Travel planning', [
    promoTab(1031, 'Weekend itinerary', 'maps.google.com/travel'),
    promoTab(1032, 'Hotel shortlist', 'booking.com'),
  ]),
]

const tileManagerModel = promoManagerModel({
  sidebarExpanded: true,
  viewedWindowId: 1,
  windows: tileWindows,
})

const smallTileManagerModel = promoManagerModel({
  sidebarExpanded: false,
  viewedWindowId: 1,
  windows: tileWindows,
})

export const SmallPromoPage = () => (
  <PromoFrame size="small">
    <section className="small-promo-copy">
      <PromoEyebrow>Tabs, together</PromoEyebrow>
      <PromoHeadline>Your tabs, in their place.</PromoHeadline>
      <PromoBody>Find your flow across every window.</PromoBody>
    </section>
    <div
      className="small-promo-manager"
      aria-label="Tabby across browser windows"
    >
      <PromoTabManager
        model={smallTileManagerModel}
        className="h-full w-full"
      />
    </div>
    <div className="small-promo-omnibar" aria-label="Search preview">
      <PromoOmnibar query="inbox" results={findAnythingResults.slice(0, 2)} />
    </div>
  </PromoFrame>
)

export const MarqueePromoPage = () => (
  <PromoFrame size="marquee">
    <section className="marquee-promo-copy">
      <PromoEyebrow>A clearer view of your browser</PromoEyebrow>
      <PromoHeadline>Every window. Every tab. In view.</PromoHeadline>
      <PromoBody>
        Search and organize open pages across Chrome windows from one simple
        place.
      </PromoBody>
    </section>
    <div
      className="marquee-promo-manager"
      aria-label="Tabby across browser windows"
    >
      <PromoTabManager model={tileManagerModel} className="h-full w-full" />
    </div>
    <div className="marquee-promo-omnibar" aria-label="Search preview">
      <PromoOmnibar query="inbox" results={findAnythingResults} />
    </div>
  </PromoFrame>
)
