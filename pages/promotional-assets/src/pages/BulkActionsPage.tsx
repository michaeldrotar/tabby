import { PromoFrame } from '../components/PromoFrame'
import {
  promoManagerModel,
  promoTab,
  PromoTabManager,
  promoWindow,
} from '../components/PromoTabManager'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'
import type { TabManagerAction } from '@extension/ui/tab-manager/TabManager'

const batchTabIds = [601, 602, 603, 604, 605]
const batchTabs = [
  promoTab(601, 'Team dashboard', 'linear.app/team'),
  promoTab(602, 'Product roadmap', 'linear.app/roadmap'),
  promoTab(603, 'Design system', 'figma.com/design/system'),
  promoTab(604, 'Chrome extension API', 'developer.chrome.com/docs/extensions'),
  promoTab(605, 'Customer review notes', 'docs.google.com/document/reviews'),
  promoTab(606, 'Launch checklist', 'github.com/tabby/launch'),
]

const actions: TabManagerAction[] = [
  {
    id: 'close',
    label: 'Close 5 tabs',
    icon: 'Trash2',
    kind: 'primary',
    destructive: true,
  },
  {
    id: 'move',
    label: 'Move 5 tabs to window',
    icon: 'MonitorUp',
    kind: 'secondary',
    panel: 'windows',
  },
  {
    id: 'group',
    label: 'Group 5 tabs',
    icon: 'FolderPlus',
    kind: 'secondary',
    panel: 'groups',
  },
  {
    id: 'pin',
    label: 'Pin 5 tabs',
    icon: 'Pin',
    kind: 'secondary',
  },
  {
    id: 'discard',
    label: 'Discard 5 tabs',
    icon: 'MemoryStick',
    kind: 'secondary',
  },
  {
    id: 'copy',
    label: 'Copy 5 tabs',
    icon: 'Copy',
    kind: 'secondary',
    panel: 'copy',
  },
]

const firstModel = promoManagerModel({
  sidebarExpanded: false,
  viewedWindowId: 1,
  windows: [promoWindow(1, 'Product work', batchTabs, { active: true })],
  selectedTabIds: batchTabIds,
  selectionMode: 'multi-select',
})

const menuModel = promoManagerModel({
  sidebarExpanded: false,
  viewedWindowId: 1,
  windows: [promoWindow(1, 'Product work', batchTabs, { active: true })],
  selectedTabIds: batchTabIds,
  selectionMode: 'multi-select',
  actions,
  contextActions: actions,
  actionMenu: { target: { type: 'tab', id: 601 } },
})

const discardedModel = promoManagerModel({
  sidebarExpanded: false,
  viewedWindowId: 1,
  windows: [
    promoWindow(
      1,
      'Product work',
      batchTabs.map((tab) =>
        batchTabIds.includes(tab.id) ? { ...tab, discarded: true } : tab,
      ),
      { active: true },
    ),
  ],
})

const states = [
  { step: 'Select a batch', model: firstModel },
  { step: 'Choose an action', model: menuModel },
  { step: 'Apply it to all', model: discardedModel },
]

export const BulkActionsPage = () => (
  <PromoFrame>
    <section className="bulk-heading">
      <PromoEyebrow>Work faster, together</PromoEyebrow>
      <PromoHeadline>One selection. Many actions.</PromoHeadline>
      <PromoBody>
        Move, group, pin, reload, copy, discard, or close a batch of tabs
        together.
      </PromoBody>
    </section>
    <section className="bulk-states" aria-label="Bulk tab actions">
      {states.map(({ step, model }, index) => (
        <article className="bulk-state" key={step}>
          <h2 className="bulk-step">
            <span>{index + 1}</span>
            {step}
          </h2>
          <div
            className={`
              bulk-manager
              ${index === 1 ? 'bulk-menu-hover-discard' : ''}
            `}
          >
            <PromoTabManager model={model} className="h-full w-full" />
          </div>
        </article>
      ))}
    </section>
  </PromoFrame>
)
