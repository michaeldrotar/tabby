import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { useEffect, useRef, useState } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import type { MouseEvent } from 'react'

// Simple colored icon for demonstration
const ColoredIcon = ({ color }: { color: string }) => (
  <div className="h-5 w-5 rounded" style={{ backgroundColor: color }} />
)

const singleColumnDecorator: Decorator = (Story) => (
  <div className="flex w-[320px] max-w-full flex-col gap-2 p-4">
    <Story />
  </div>
)

const twoColumnDecorator: Decorator = (Story) => (
  <div className="flex w-[640px] max-w-full flex-col gap-2 p-4">
    <Story />
  </div>
)

const meta = {
  title: 'Tab Manager/BrowserTabItem',
  component: BrowserTabItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A presentational component for displaying a browser tab. Supports multiple states: default, hover, selected, and active. Uses left border accent for visual distinction.',
      },
    },
  },
  tags: [],
  argTypes: {
    tabId: {
      description: 'Unique identifier for the browser tab',
      control: 'number',
    },
    title: {
      description: 'Title of the browser tab',
      control: 'text',
    },
    url: {
      description: 'URL of the browser tab',
      control: 'text',
    },
    favicon: {
      description: 'Custom icon/favicon component',
      control: false,
    },
    selected: {
      description:
        'Whether the tab is selected (keyboard navigation or multi-select)',
      control: 'boolean',
    },
    active: {
      description: 'Whether this is the currently active browser tab',
      control: 'boolean',
    },
    loading: {
      description: 'Whether the tab is currently loading',
      control: 'boolean',
    },
    pinned: {
      description: 'Whether the tab is pinned',
      control: 'boolean',
    },
    discarded: {
      description: 'Whether the tab is discarded/unloaded (grayed out)',
      control: 'boolean',
    },
    onClick: {
      action: 'clicked',
      description: 'Called when the tab item is clicked',
    },
  },
} satisfies Meta<typeof BrowserTabItem>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default tab with interactive controls.
 * Toggle isSelected and isActive to see different states.
 */
export const Default: Story = {
  args: {
    tabId: 1,
    title: 'GitHub - microsoft/vscode',
    url: 'https://github.com/microsoft/vscode',
    favicon: <ColoredIcon color="#24292e" />,
    selected: false,
    active: false,
  },
  decorators: [singleColumnDecorator],
}

/**
 * All states displayed side by side for visual comparison.
 */
export const AllStates = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Static comparison of all component states. Left column shows single states, right column shows important state combinations.',
      },
    },
  },
  decorators: [twoColumnDecorator],
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      {/* Left Column: Simple States */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Single States
        </h2>

        {/* Default State */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Default
          </h3>
          <BrowserTabItem
            tabId={1}
            title="Default Tab"
            url="https://example.com/default"
            favicon={<ColoredIcon color="#6b7280" />}
          />
        </div>

        {/* Hover State */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Hover
          </h3>
          <BrowserTabItem
            tabId={2}
            title="Hover Tab"
            url="https://example.com/hover"
            favicon={<ColoredIcon color="#6b7280" />}
            data-hover
          />
        </div>

        {/* Keyboard Focus State */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Keyboard Focus
          </h3>
          <BrowserTabItem
            tabId={3}
            title="Focused Tab"
            url="https://example.com/focus"
            favicon={<ColoredIcon color="#6b7280" />}
            data-focus
          />
        </div>

        {/* Selected State */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Selected
          </h3>
          <BrowserTabItem
            tabId={5}
            title="Selected Tab"
            url="https://example.com/selected"
            favicon={<ColoredIcon color="#6b7280" />}
            selected
          />
        </div>

        {/* Active State */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Active (Current Browser Tab)
          </h3>
          <BrowserTabItem
            tabId={6}
            title="Active Tab"
            url="https://example.com/active"
            favicon={<ColoredIcon color="#6b7280" />}
            active
          />
        </div>

        {/* Loading */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Loading
          </h3>
          <BrowserTabItem tabId={12} title="" url="" loading={true} />
        </div>

        {/* Pinned */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Pinned
          </h3>
          <BrowserTabItem
            tabId={13}
            title="Gmail"
            url="https://mail.google.com"
            favicon={<ColoredIcon color="#EA4335" />}
            pinned={true}
          />
        </div>

        {/* Discarded */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Discarded
          </h3>
          <BrowserTabItem
            tabId={14}
            title="Unloaded Tab"
            url="https://example.com/unloaded"
            favicon={<ColoredIcon color="#888888" />}
            discarded={true}
          />
        </div>
      </div>

      {/* Right Column: Combination States */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Combination States
        </h2>

        {/* Active + Selected */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Active + Selected
          </h3>
          <BrowserTabItem
            tabId={7}
            title="Active Selected Tab"
            url="https://example.com/active-selected"
            favicon={<ColoredIcon color="#6b7280" />}
            active
            selected
          />
        </div>

        {/* Active + Selected + Focus */}
        <div>
          <h3
            className="text-muted mb-2 text-xs font-semibold uppercase"
            style={{ whiteSpace: 'nowrap' }}
          >
            Active + Selected + Focus
          </h3>
          <BrowserTabItem
            tabId={11}
            title="Focused Active Selected Tab"
            url="https://example.com/focus-active-selected"
            favicon={<ColoredIcon color="#6b7280" />}
            active
            selected
            data-focus
          />
        </div>

        {/* Focus + Selected */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Focus + Selected
          </h3>
          <BrowserTabItem
            tabId={8}
            title="Focused Selected Tab"
            url="https://example.com/focus-selected"
            favicon={<ColoredIcon color="#6b7280" />}
            selected
            data-focus
          />
        </div>

        {/* Focus + Active */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Focus + Active
          </h3>
          <BrowserTabItem
            tabId={9}
            title="Focused Active Tab"
            url="https://example.com/focus-active"
            favicon={<ColoredIcon color="#6b7280" />}
            active
            data-focus
          />
        </div>

        {/* Hover + Selected */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Hover + Selected
          </h3>
          <BrowserTabItem
            tabId={10}
            title="Hovered Selected Tab"
            url="https://example.com/hover-selected"
            favicon={<ColoredIcon color="#6b7280" />}
            selected
            data-hover
          />
        </div>

        {/* Pinned + Selected */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Pinned + Selected
          </h3>
          <BrowserTabItem
            tabId={15}
            title="GitHub"
            url="https://github.com/notifications"
            favicon={<ColoredIcon color="#24292e" />}
            pinned={true}
            selected={true}
          />
        </div>

        {/* Pinned + Active */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Pinned + Active
          </h3>
          <BrowserTabItem
            tabId={16}
            title="Calendar"
            url="https://calendar.google.com"
            favicon={<ColoredIcon color="#4285F4" />}
            pinned={true}
            active={true}
          />
        </div>

        {/* Discarded + Pinned */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Discarded + Pinned
          </h3>
          <BrowserTabItem
            tabId={17}
            title="Background Tab"
            url="https://example.com/background"
            favicon={<ColoredIcon color="#9ca3af" />}
            discarded={true}
            pinned={true}
          />
        </div>
      </div>
    </div>
  ),
}

/**
 * Interactive tab list with realistic selection behavior.
 * Click to select tabs - demonstrates real-world usage.
 */
const InteractiveListComponent = () => {
  const [selectedId, setSelectedId] = useState<number | null>(2)
  const [activeId] = useState<number>(2)

  const tabs = [
    {
      id: 1,
      title: 'GitHub - microsoft/vscode',
      url: 'https://github.com/microsoft/vscode',
      color: '#24292e',
    },
    {
      id: 2,
      title: 'Gmail - Inbox',
      url: 'https://mail.google.com/mail/u/0/#inbox',
      color: '#EA4335',
    },
    {
      id: 3,
      title: 'Google Docs - Project Plan',
      url: 'https://docs.google.com/document/d/abc123',
      color: '#4285F4',
    },
    {
      id: 4,
      title: 'Stack Overflow - React Hooks',
      url: 'https://stackoverflow.com/questions/53945763',
      color: '#F48024',
    },
    {
      id: 5,
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/',
      color: '#000000',
    },
  ]

  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted mb-3 text-xs">
        Click any tab to select it. Tab #2 (Gmail) is the active browser tab.
      </p>
      {tabs.map((tab) => (
        <BrowserTabItem
          key={tab.id}
          tabId={tab.id}
          title={tab.title}
          url={tab.url}
          favicon={<ColoredIcon color={tab.color} />}
          selected={selectedId === tab.id}
          active={activeId === tab.id}
          onClick={() => setSelectedId(tab.id)}
        />
      ))}
      <div className="text-muted mt-2 text-xs">
        Selected: {selectedId ? `Tab #${selectedId}` : 'None'}
      </div>
    </div>
  )
}

export const InteractiveList = {
  parameters: {
    docs: {
      description: {
        story:
          'Realistic multi-tab scenario. Notice how the active tab (Gmail) has a bold left border, while selected tabs have a subtle border.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <InteractiveListComponent />,
}

/**
 * Edge cases and content variations.
 */
export const ContentVariations = {
  parameters: {
    controls: { disable: true },
  },
  decorators: [singleColumnDecorator],
  render: () => (
    <div className="flex flex-col gap-2">
      <BrowserTabItem
        tabId={1}
        title="This is an extremely long tab title that should be truncated with an ellipsis when it exceeds the available width of the component"
        url="https://example.com/very/long/path/to/resource"
        favicon={<ColoredIcon color="#10b981" />}
      />
      <BrowserTabItem
        tabId={2}
        title="Short Title"
        url="https://this-is-a-very-long-subdomain.example-domain-name.co.uk/path"
        favicon={<ColoredIcon color="#6366f1" />}
      />
      <BrowserTabItem
        tabId={3}
        title=""
        url="http://localhost:3000"
        favicon={<ColoredIcon color="#6b7280" />}
      />
      <BrowserTabItem
        tabId={4}
        title="No Favicon Example"
        url="https://example.com"
      />
    </div>
  ),
}

type ScenarioAction = {
  timestamp: number
  state: {
    hoverId?: number | null
    focusId?: number | null
    selectedIds: number[]
    activeId: number
    loadingIds?: number[]
    pinnedIds?: number[]
    discardedIds?: number[]
    visibleTabIds?: number[]
  }
}

type ScenarioStep = {
  label: string
  startTime: number
  endTime: number
  actions: ScenarioAction[]
}

type ScenarioConfig = {
  steps: ScenarioStep[]
  totalDuration: number
}

const MOUSE_SCENARIO: ScenarioConfig = {
  totalDuration: 14000,
  steps: [
    {
      label: 'Tab 2 (Gmail) is active',
      startTime: 0,
      endTime: 1500,
      actions: [
        {
          timestamp: 0,
          state: {
            hoverId: 2,
            selectedIds: [2],
            activeId: 2,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Pin tab 1',
      startTime: 1500,
      endTime: 3000,
      actions: [
        {
          timestamp: 1500,
          state: {
            hoverId: 1,
            selectedIds: [2],
            activeId: 2,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 1900,
          state: {
            hoverId: 1,
            selectedIds: [1],
            activeId: 1,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 2500,
          state: {
            hoverId: 1,
            selectedIds: [1],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Click tab 4 to activate',
      startTime: 3000,
      endTime: 5000,
      actions: [
        {
          timestamp: 3000,
          state: {
            hoverId: 2,
            selectedIds: [1],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 3400,
          state: {
            hoverId: 3,
            selectedIds: [1],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 3800,
          state: {
            hoverId: 4,
            selectedIds: [1],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 4500,
          state: {
            hoverId: 4,
            selectedIds: [4],
            activeId: 4,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Shift+Click tab 1 to select range',
      startTime: 5000,
      endTime: 7000,
      actions: [
        {
          timestamp: 5000,
          state: {
            hoverId: 3,
            selectedIds: [4],
            activeId: 4,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 5400,
          state: {
            hoverId: 2,
            selectedIds: [4],
            activeId: 4,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 5800,
          state: {
            hoverId: 1,
            selectedIds: [4],
            activeId: 4,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 6400,
          state: {
            hoverId: 1,
            selectedIds: [1, 2, 3, 4],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Open new tab',
      startTime: 7000,
      endTime: 9000,
      actions: [
        {
          timestamp: 7000,
          state: {
            hoverId: 1,
            selectedIds: [1, 2, 3, 4],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 7500,
          state: {
            hoverId: 1,
            selectedIds: [6],
            activeId: 6,
            loadingIds: [6],
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          timestamp: 8200,
          state: {
            hoverId: 1,
            selectedIds: [6],
            activeId: 6,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5, 6],
          },
        },
      ],
    },
    {
      label: 'Close new tab',
      startTime: 9000,
      endTime: 10500,
      actions: [
        {
          timestamp: 9000,
          state: {
            hoverId: 1,
            selectedIds: [6],
            activeId: 6,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          timestamp: 9750,
          state: {
            hoverId: 1,
            selectedIds: [1],
            activeId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Unpin tab 1',
      startTime: 10500,
      endTime: 12000,
      actions: [
        {
          timestamp: 11250,
          state: {
            hoverId: 1,
            selectedIds: [1],
            activeId: 1,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Return to tab 2',
      startTime: 12000,
      endTime: 14000,
      actions: [
        {
          timestamp: 12000,
          state: {
            hoverId: 2,
            selectedIds: [1],
            activeId: 1,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 12750,
          state: {
            hoverId: 2,
            selectedIds: [2],
            activeId: 2,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
  ],
}

const KEYBOARD_SCENARIO: ScenarioConfig = {
  totalDuration: 14000,
  steps: [
    {
      label: 'Tab 2 (Gmail) is active',
      startTime: 0,
      endTime: 1500,
      actions: [
        {
          timestamp: 0,
          state: {
            selectedIds: [2],
            activeId: 2,
            focusId: 2,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Press ↑ to tab 1, pin it',
      startTime: 1500,
      endTime: 3000,
      actions: [
        {
          timestamp: 1900,
          state: {
            selectedIds: [1],
            activeId: 1,
            focusId: 1,
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 2500,
          state: {
            selectedIds: [1],
            activeId: 1,
            focusId: 1,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Press ↓ three times to reach tab 4',
      startTime: 3000,
      endTime: 5000,
      actions: [
        {
          timestamp: 3400,
          state: {
            selectedIds: [2],
            activeId: 2,
            focusId: 2,
            pinnedIds: [1],
            discardedIds: [3],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 3900,
          state: {
            selectedIds: [3],
            activeId: 3,
            focusId: 3,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 4500,
          state: {
            selectedIds: [4],
            activeId: 4,
            focusId: 4,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Shift+↑ three times to select range',
      startTime: 5000,
      endTime: 7000,
      actions: [
        {
          timestamp: 5400,
          state: {
            selectedIds: [3, 4],
            activeId: 3,
            focusId: 3,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 5900,
          state: {
            selectedIds: [2, 3, 4],
            activeId: 2,
            focusId: 2,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 6400,
          state: {
            selectedIds: [1, 2, 3, 4],
            activeId: 1,
            focusId: 1,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Open new tab with Cmd+T',
      startTime: 7000,
      endTime: 9000,
      actions: [
        {
          timestamp: 7000,
          state: {
            selectedIds: [1, 2, 3, 4],
            activeId: 1,
            focusId: 1,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
        {
          timestamp: 7500,
          state: {
            selectedIds: [6],
            activeId: 6,
            focusId: 6,
            loadingIds: [6],
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          timestamp: 8200,
          state: {
            selectedIds: [6],
            activeId: 6,
            focusId: 6,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5, 6],
          },
        },
      ],
    },
    {
      label: 'Close new tab with Cmd+W',
      startTime: 9000,
      endTime: 10500,
      actions: [
        {
          timestamp: 9750,
          state: {
            selectedIds: [1],
            activeId: 1,
            focusId: 1,
            pinnedIds: [1],
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Unpin tab 1',
      startTime: 10500,
      endTime: 12000,
      actions: [
        {
          timestamp: 11250,
          state: {
            selectedIds: [1],
            activeId: 1,
            focusId: 1,
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
    {
      label: 'Press ↓ to return to tab 2',
      startTime: 12000,
      endTime: 14000,
      actions: [
        {
          timestamp: 12750,
          state: {
            selectedIds: [2],
            activeId: 2,
            focusId: 2,
            visibleTabIds: [1, 2, 3, 4, 5],
          },
        },
      ],
    },
  ],
}

const WorkflowDemo = ({
  scenario,
  showCursor = false,
}: {
  scenario: ScenarioConfig
  showCursor?: boolean
}) => {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const tabListRef = useRef<HTMLDivElement>(null)

  const tabs = [
    {
      id: 1,
      title: 'GitHub - microsoft/vscode',
      url: 'https://github.com/microsoft/vscode',
      color: '#24292e',
    },
    {
      id: 2,
      title: 'Gmail - Inbox',
      url: 'https://mail.google.com/mail/u/0/#inbox',
      color: '#EA4335',
    },
    {
      id: 3,
      title: 'Google Docs - Project Plan',
      url: 'https://docs.google.com/document/d/abc123',
      color: '#4285F4',
    },
    {
      id: 4,
      title: 'Stack Overflow - React Hooks',
      url: 'https://stackoverflow.com/questions/53945763',
      color: '#F48024',
    },
    {
      id: 5,
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/',
      color: '#000000',
    },
    {
      id: 6,
      title: 'New Tab',
      url: 'chrome://newtab',
      color: '#8B5CF6',
    },
  ]

  // Find current action and step based on time
  const allActions = scenario.steps.flatMap((step) => step.actions)
  const currentAction = allActions.reduce(
    (prev, curr) => (currentTime >= curr.timestamp ? curr : prev),
    allActions[0]!,
  )

  const currentStep =
    scenario.steps.find(
      (step) => currentTime >= step.startTime && currentTime < step.endTime,
    ) || scenario.steps[scenario.steps.length - 1]!

  // Filter tabs based on visibleTabIds if provided
  const visibleTabIds = currentAction?.state.visibleTabIds
  const visibleTabs = visibleTabIds
    ? tabs.filter((tab) => visibleTabIds.includes(tab.id))
    : tabs

  useEffect(() => {
    if (!isPlaying) return

    const startTimestamp = Date.now() - currentTime
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimestamp

      if (elapsed >= scenario.totalDuration) {
        setCurrentTime(0)
      } else {
        setCurrentTime(elapsed)
      }
    }, 16) // 60fps

    return () => clearInterval(timer)
  }, [isPlaying, currentTime, scenario.totalDuration])

  // Update cursor position for mouse demo
  useEffect(() => {
    if (!showCursor || !tabListRef.current) return

    const hoveredId = currentAction?.state.hoverId
    if (!hoveredId) return

    const tabElement = tabListRef.current.querySelector(
      `[data-tab-id="${hoveredId}"]`,
    )
    if (tabElement) {
      const rect = tabElement.getBoundingClientRect()
      const listRect = tabListRef.current.getBoundingClientRect()
      setCursorPos({
        x: rect.left - listRect.left + rect.width / 2,
        y: rect.top - listRect.top + rect.height / 2,
      })
    }
  }, [currentAction, showCursor])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const targetTime = percent * scenario.totalDuration

    // Find which section was clicked
    const clickedStep =
      scenario.steps.find(
        (step) => targetTime >= step.startTime && targetTime < step.endTime,
      ) || scenario.steps[scenario.steps.length - 1]!

    setCurrentTime(clickedStep.startTime)
    setIsPlaying(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Integrated Progress Bar + Label + Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={`
            text-muted flex-shrink-0 text-xl transition-colors
            hover:text-foreground
          `}
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Progress Bar + Label */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Current Step Label */}
          <div
            className={`
              text-foreground min-h-[1.25rem] min-w-0 text-sm font-medium
            `}
          >
            {currentStep.label}
          </div>

          {/* Segmented Progress Bar */}
          <button
            type="button"
            className={`
              group relative flex h-2 w-full cursor-pointer overflow-hidden
              rounded-full
            `}
            onClick={handleProgressClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const rect = e.currentTarget.getBoundingClientRect()
                const mouseEvent = {
                  currentTarget: e.currentTarget,
                  clientX: rect.left + rect.width / 2,
                } as Parameters<typeof handleProgressClick>[0]
                handleProgressClick(mouseEvent)
              }
            }}
            aria-label="Progress bar - click to jump to step"
          >
            {scenario.steps.map((step, idx) => {
              const segmentWidth =
                ((step.endTime - step.startTime) / scenario.totalDuration) * 100
              const isActive =
                currentTime >= step.startTime && currentTime < step.endTime
              const isPast = currentTime >= step.endTime
              const progressInSegment = isActive
                ? ((currentTime - step.startTime) /
                    (step.endTime - step.startTime)) *
                  100
                : 0

              return (
                <div
                  key={step.startTime}
                  className="relative flex-shrink-0"
                  style={{ width: `${segmentWidth}%` }}
                >
                  {/* Background segment */}
                  <div
                    className={`
                      bg-muted/50 h-full transition-colors
                      group-hover:bg-muted
                    `}
                  />

                  {/* Progress fill */}
                  {(isActive || isPast) && (
                    <div
                      className="bg-accent absolute left-0 top-0 h-full"
                      style={{
                        width: isPast ? '100%' : `${progressInSegment}%`,
                        transition: isPlaying ? 'none' : 'width 0.2s ease-out',
                      }}
                    />
                  )}

                  {/* Gap between segments (white line) */}
                  {idx < scenario.steps.length - 1 && (
                    <div
                      className={`
                        bg-background absolute right-0 top-0 h-full w-px
                      `}
                    />
                  )}
                </div>
              )
            })}
          </button>
        </div>
      </div>

      {/* Tab List with optional cursor */}
      <div ref={tabListRef} className="relative flex flex-col gap-1">
        {/* Visible cursor for mouse demo */}
        {showCursor && currentAction?.state.hoverId && (
          <div
            className={`
              pointer-events-none absolute z-10 transition-all duration-300
            `}
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5.5 3.21V20.79L10.47 15.82L13.5 20.79L15.5 19.79L12.47 14.82L19.5 13.79L5.5 3.21Z"
                fill="currentColor"
                className="text-foreground drop-shadow-lg"
              />
            </svg>
          </div>
        )}

        {visibleTabs.map((tab) => {
          const isHovered = currentAction?.state.hoverId === tab.id
          const isFocused = currentAction?.state.focusId === tab.id
          const isSelected =
            currentAction?.state.selectedIds.includes(tab.id) || false
          const isActive = currentAction?.state.activeId === tab.id
          const isLoading =
            currentAction?.state.loadingIds?.includes(tab.id) || false
          const isPinned =
            currentAction?.state.pinnedIds?.includes(tab.id) || false
          const isDiscarded =
            currentAction?.state.discardedIds?.includes(tab.id) || false

          return (
            <BrowserTabItem
              key={tab.id}
              tabId={tab.id}
              title={tab.title}
              url={tab.url}
              favicon={<ColoredIcon color={tab.color} />}
              selected={isSelected}
              active={isActive}
              loading={isLoading}
              pinned={isPinned}
              discarded={isDiscarded}
              data-hover={isHovered || undefined}
              data-focus={isFocused || undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * Demonstrates realistic mouse-driven workflow with hover, selection, and activation.
 * Shows how clicking activates tabs and Shift+Click multi-selects.
 */
export const MouseWorkflow = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Simulates realistic mouse interactions: clicking tabs to activate them, Shift+Click to multi-select, and working with pinned and discarded tabs.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <WorkflowDemo scenario={MOUSE_SCENARIO} showCursor />,
}

/**
 * Demonstrates keyboard navigation workflow with arrow keys, Space, and Enter.
 * Shows how arrow keys navigate and activate tabs.
 */
export const KeyboardWorkflow = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Simulates keyboard navigation: arrow keys to navigate and activate tabs, Space to multi-select without activating, Enter to activate the focused tab.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <WorkflowDemo scenario={KEYBOARD_SCENARIO} />,
}
