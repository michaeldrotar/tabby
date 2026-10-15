import { PromoFrame } from '../components/PromoFrame'
import {
  promoManagerModel,
  promoTab,
  PromoTabManager,
  promoWindow,
} from '../components/PromoTabManager'
import {
  PromoBody,
  PromoEyebrow,
  PromoFootnote,
  PromoHeadline,
} from '../components/PromoText'

const smallModel = promoManagerModel({
  viewedWindowId: 1,
  windows: [
    promoWindow(
      1,
      'Today',
      [
        promoTab(401, 'Project brief', 'docs.google.com/project', {
          active: true,
        }),
        promoTab(402, 'Design review', 'figma.com/design/review'),
        promoTab(403, 'Inbox', 'mail.google.com/mail/inbox'),
        promoTab(404, 'Release notes', 'github.com/tabby/releases'),
      ],
      { active: true },
    ),
    promoWindow(2, 'Reading', [
      promoTab(411, 'Browser notes', 'developer.mozilla.org'),
      promoTab(412, 'Weekend reading', 'medium.com/reading'),
    ]),
  ],
})

const fullModel = promoManagerModel({
  viewedWindowId: 5,
  windows: [
    promoWindow(1, 'Planning', [
      promoTab(600, 'Roadmap', 'linear.app/roadmap'),
      promoTab(601, 'Project brief', 'docs.google.com/project'),
    ]),
    promoWindow(2, 'Research', [
      promoTab(602, 'Research notes', 'docs.google.com/research'),
      promoTab(610, 'Field interviews', 'drive.google.com/interviews'),
      promoTab(611, 'Reference library', 'developer.mozilla.org'),
    ]),
    promoWindow(3, 'Design', [
      promoTab(603, 'Design system', 'figma.com/design/system'),
      promoTab(612, 'Prototype', 'figma.com/proto/project'),
      promoTab(613, 'Component library', 'storybook.tabby.dev'),
      promoTab(614, 'Usability notes', 'docs.google.com/usability'),
    ]),
    promoWindow(4, 'Communication', [
      promoTab(604, 'Customer inbox', 'mail.google.com/mail/inbox'),
      promoTab(615, 'Team chat', 'slack.com/team'),
      promoTab(616, 'Weekly update', 'docs.google.com/weekly-update'),
    ]),
    promoWindow(
      5,
      'Product work',
      [
        promoTab(606, 'Product brief', 'notion.so/product-brief', {
          active: true,
        }),
        ...[
          ['Launch checklist', 'github.com/tabby/launch'],
          ['Design handoff', 'figma.com/design/handoff'],
          ['Customer feedback', 'linear.app/feedback'],
          ['Help center', 'support.google.com'],
          ['Release notes', 'github.com/tabby/releases'],
        ].map(([title, url], index) => promoTab(617 + index, title!, url!)),
      ],
      { active: true },
    ),
    promoWindow(6, 'Reading list', [
      promoTab(607, 'The creative act', 'read.amazon.com'),
      promoTab(622, 'Browser patterns', 'web.dev'),
    ]),
    promoWindow(7, 'Support', [
      promoTab(608, 'Help center', 'support.google.com'),
      promoTab(623, 'Open issues', 'github.com/tabby/issues'),
      promoTab(624, 'Customer notes', 'docs.google.com/customer-notes'),
      promoTab(625, 'Release tracker', 'linear.app/releases'),
      promoTab(626, 'Team inbox', 'mail.google.com/mail/inbox/team'),
    ]),
    promoWindow(8, 'Reference', [
      promoTab(609, 'Chrome APIs', 'developer.chrome.com/docs/extensions'),
      promoTab(627, 'React docs', 'react.dev'),
      promoTab(628, 'TypeScript handbook', 'typescriptlang.org/docs'),
    ]),
  ],
})

export const ScalePage = () => (
  <PromoFrame>
    <section className="scale-copy">
      <PromoEyebrow>Your browser, your pace</PromoEyebrow>
      <PromoHeadline>A tab manager that fits you.</PromoHeadline>
      <PromoBody>From a few open pages to a browser full of work.</PromoBody>
      <PromoFootnote>Scale to infinity and beyond.</PromoFootnote>
    </section>
    <div className="scale-small-preview" aria-label="A compact tab manager">
      <PromoTabManager model={smallModel} className="h-full w-full" />
    </div>
    <div className="scale-large-preview" aria-label="A full tab manager">
      <PromoTabManager model={fullModel} className="h-full w-full" />
    </div>
  </PromoFrame>
)
