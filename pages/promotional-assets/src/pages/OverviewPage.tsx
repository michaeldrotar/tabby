import { PromoFrame } from '../components/PromoFrame'
import { PromoOmnibar } from '../components/PromoOmnibar'
import {
  promoManagerModel,
  promoTab,
  PromoTabManager,
  promoWindow,
} from '../components/PromoTabManager'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'
import { overviewFeaturedTab, overviewResults } from '../data/overviewResults'

const managerModel = promoManagerModel({
  viewedWindowId: 1,
  windows: [
    promoWindow(
      1,
      'Design studio',
      [
        overviewFeaturedTab,
        promoTab(105, 'Launch plan', 'docs.google.com/document/launch'),
        promoTab(106, 'Product brief', 'notion.so/product-brief'),
        promoTab(104, 'Customer feedback', 'linear.app/team/feedback'),
        promoTab(107, 'Release checklist', 'github.com/tabby/release'),
        promoTab(108, 'Team inbox', 'mail.google.com/mail/inbox'),
      ],
      { active: true },
    ),
    promoWindow(2, 'Research', [
      promoTab(201, 'Browser study', 'docs.google.com/document/research', {
        active: true,
      }),
      promoTab(202, 'Reference library', 'developer.mozilla.org'),
      promoTab(203, 'Competitor notes', 'notion.so/research'),
    ]),
    promoWindow(3, 'Reading list', [
      promoTab(301, 'The creative act', 'read.amazon.com'),
      promoTab(302, 'Design systems', 'alistapart.com'),
    ]),
  ],
})

export const OverviewPage = () => (
  <PromoFrame>
    <section className="overview-copy">
      <PromoEyebrow>A clearer view of your browser</PromoEyebrow>
      <PromoHeadline>
        See every window.
        <br />
        Find any tab.
      </PromoHeadline>
      <PromoBody>
        Keep your open tabs together, then jump straight to the page you need.
      </PromoBody>
    </section>
    <section className="overview-stage" aria-label="Tabby overview">
      <div className="overview-manager">
        <PromoTabManager model={managerModel} className="h-full w-full" />
      </div>
      <div className="overview-omnibar">
        <PromoOmnibar query="design" results={overviewResults} />
      </div>
    </section>
  </PromoFrame>
)
