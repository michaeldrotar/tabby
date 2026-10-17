import { PromoFrame } from '../components/PromoFrame'
import {
  promoManagerModel,
  promoTab,
  PromoTabManager,
  promoWindow,
} from '../components/PromoTabManager'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'

const windows = [
  promoWindow(
    1,
    'Design studio',
    [
      promoTab(401, 'Design system', 'figma.com/design/system', {
        active: true,
      }),
      promoTab(402, 'Product brief', 'notion.so/product-brief'),
      promoTab(403, 'Launch checklist', 'github.com/tabby/launch'),
    ],
    { active: true, icon: 'palette', iconColor: 'purple' },
  ),
  promoWindow(
    2,
    'Research',
    [
      promoTab(411, 'Research notes', 'docs.google.com/research'),
      promoTab(412, 'Reference library', 'developer.mozilla.org'),
    ],
    { icon: 'book', iconColor: 'green' },
  ),
  promoWindow(
    3,
    'Reading list',
    [
      promoTab(421, 'The creative act', 'read.amazon.com'),
      promoTab(422, 'Browser patterns', 'web.dev'),
    ],
    { icon: 'book', iconColor: 'red' },
  ),
  promoWindow(
    4,
    'Weekend plans',
    [
      promoTab(431, 'Places to visit', 'maps.google.com'),
      promoTab(432, 'Coffee spots', 'maps.google.com/coffee'),
    ],
    { icon: 'coffee', iconColor: 'orange' },
  ),
]
const base = promoManagerModel({ windows, viewedWindowId: 1 })

export const ProjectWindowsPage = () => (
  <PromoFrame>
    <section className="project-windows-copy">
      <PromoEyebrow>Recognize every window</PromoEyebrow>
      <PromoHeadline>A home for every project.</PromoHeadline>
      <PromoBody>
        Give each window a name, an icon, and a color. Pick up where you left
        off.
      </PromoBody>
    </section>
    <div
      className="project-window-editor"
      aria-label="Choose a window name, icon, and color"
    >
      <PromoTabManager
        model={{
          ...base,
          editingWindow: {
            windowId: 1,
            name: 'Design studio',
            icon: 'palette',
            iconColor: 'purple',
            useCustom: true,
          },
        }}
        className="h-full w-full"
      />
    </div>
    <div className="project-window-picker" aria-label="Named project windows">
      <PromoTabManager
        model={{ ...base, windowPicker: true }}
        className="h-full w-full"
      />
    </div>
  </PromoFrame>
)
