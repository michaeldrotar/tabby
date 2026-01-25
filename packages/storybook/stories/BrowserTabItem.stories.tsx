import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fn } from 'storybook/test'
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
  args: {
    onClick: fn(),
    onClose: fn(),
  },
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
      description:
        'Whether the tab is loading - shows radial spinner over favicon',
      control: 'boolean',
    },
    blurred: {
      description:
        'Whether to blur title and URL text (typically during initial load)',
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
    audio: {
      description:
        "Audio state: 'muted' shows muted icon, 'on' shows playing icon, 'off' shows nothing",
      control: 'select',
      options: ['muted', 'on', 'off'],
    },
    lastAccessed: {
      description: 'Timestamp in milliseconds when the tab was last accessed',
      control: 'number',
    },
    duplicate: {
      description: 'Whether this tab is a duplicate (same URL as another tab)',
      control: 'boolean',
    },
    onClick: {
      description: 'Called when the tab item is clicked',
      control: false,
      table: { disable: true },
    },
    onClose: {
      description:
        'Called when the close button is clicked or Delete/Backspace is pressed. When provided, a close button is shown.',
      control: false,
      table: { disable: true },
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
    loading: false,
    blurred: false,
    pinned: false,
    discarded: false,
    audio: 'off',
    lastAccessed: 1769288689393,
    duplicate: false,
  },
  decorators: [singleColumnDecorator],
}

/**
 * All states displayed side by side for visual comparison.
 */
const AllStatesComponent = () => {
  const [now] = useState(() => Date.now())

  return (
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
            active
          />
        </div>

        {/* Loading */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Loading
          </h3>
          <BrowserTabItem
            tabId={12}
            title="GitHub - microsoft/vscode"
            url="https://github.com/microsoft/vscode"
            favicon={<ColoredIcon color="#24292e" />}
            lastAccessed={now}
            loading={true}
          />
        </div>

        {/* Loading + Blurred */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Loading + Blurred
          </h3>
          <BrowserTabItem
            tabId={13}
            title="New Tab"
            url="https://example.com/new"
            favicon={<ColoredIcon color="#6b7280" />}
            lastAccessed={now}
            loading={true}
            blurred={true}
          />
        </div>

        {/* Pinned */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Pinned
          </h3>
          <BrowserTabItem
            tabId={15}
            title="Gmail"
            url="https://mail.google.com"
            favicon={<ColoredIcon color="#EA4335" />}
            lastAccessed={now}
            pinned={true}
          />
        </div>

        {/* Discarded */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Discarded
          </h3>
          <BrowserTabItem
            tabId={16}
            title="Unloaded Tab"
            url="https://example.com/unloaded"
            favicon={<ColoredIcon color="#888888" />}
            lastAccessed={now}
            discarded={true}
          />
        </div>

        {/* Audio Playing */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Audio Playing
          </h3>
          <BrowserTabItem
            tabId={17}
            title="YouTube - Music Video"
            url="https://youtube.com/watch?v=abc123"
            favicon={<ColoredIcon color="#FF0000" />}
            lastAccessed={now}
            audio="on"
          />
        </div>

        {/* Audio Muted */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Audio Muted
          </h3>
          <BrowserTabItem
            tabId={18}
            title="YouTube - Music Video"
            url="https://youtube.com/watch?v=abc123"
            favicon={<ColoredIcon color="#FF0000" />}
            lastAccessed={now}
            audio="muted"
          />
        </div>

        {/* Duplicate */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Duplicate
          </h3>
          <BrowserTabItem
            tabId={20}
            title="GitHub - microsoft/vscode"
            url="https://github.com/microsoft/vscode"
            favicon={<ColoredIcon color="#24292e" />}
            lastAccessed={now}
            duplicate={true}
          />
        </div>

        {/* Attention Title: (3) Gmail */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Attention: (3) Gmail
          </h3>
          <BrowserTabItem
            tabId={21}
            title="(3) Gmail"
            url="https://mail.google.com"
            favicon={<ColoredIcon color="#EA4335" />}
            lastAccessed={now}
          />
        </div>

        {/* Attention Title: • Slack */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Attention: • Slack
          </h3>
          <BrowserTabItem
            tabId={22}
            title="• Slack"
            url="https://slack.com"
            favicon={<ColoredIcon color="#4A154B" />}
            lastAccessed={now}
          />
        </div>

        {/* With close button (hover to see) */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            With close button
          </h3>
          <BrowserTabItem
            tabId={28}
            title="Hover to see close"
            url="https://example.com/close"
            favicon={<ColoredIcon color="#6b7280" />}
            lastAccessed={now}
            onClose={() => {}}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
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
            lastAccessed={now}
            pinned={true}
            active={true}
          />
        </div>

        {/* Active + close (button always visible) */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Active + close
          </h3>
          <BrowserTabItem
            tabId={29}
            title="Close always visible"
            url="https://example.com/active-close"
            favicon={<ColoredIcon color="#6b7280" />}
            lastAccessed={now}
            active
            onClose={() => {}}
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
            lastAccessed={now}
            discarded={true}
            pinned={true}
          />
        </div>

        {/* Loading + Blurred + Active + Selected */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Loading + Blurred + Active + Selected
          </h3>
          <BrowserTabItem
            tabId={14}
            title="Loading Tab"
            url="https://example.com/loading"
            favicon={<ColoredIcon color="#6b7280" />}
            lastAccessed={now}
            loading={true}
            blurred={true}
            active={true}
            selected={true}
          />
        </div>

        {/* Audio Playing + Pinned */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Audio Playing + Pinned
          </h3>
          <BrowserTabItem
            tabId={23}
            title="Spotify - Playlist"
            url="https://open.spotify.com"
            favicon={<ColoredIcon color="#1DB954" />}
            lastAccessed={now}
            audio="on"
            pinned={true}
          />
        </div>

        {/* Duplicate + Active */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Duplicate + Active
          </h3>
          <BrowserTabItem
            tabId={24}
            title="GitHub - microsoft/vscode"
            url="https://github.com/microsoft/vscode"
            favicon={<ColoredIcon color="#24292e" />}
            lastAccessed={now}
            duplicate={true}
            active={true}
          />
        </div>

        {/* Attention + Audible */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Attention + Audible
          </h3>
          <BrowserTabItem
            tabId={25}
            title="(5) Discord"
            url="https://discord.com"
            favicon={<ColoredIcon color="#5865F2" />}
            lastAccessed={now}
            audio="on"
          />
        </div>

        {/* Duplicate + Selected */}
        <div>
          <h3 className="text-muted mb-2 text-xs font-semibold uppercase">
            Duplicate + Selected
          </h3>
          <BrowserTabItem
            tabId={27}
            title="Stack Overflow - React Hooks"
            url="https://stackoverflow.com/questions/53945763"
            favicon={<ColoredIcon color="#F48024" />}
            lastAccessed={now}
            duplicate={true}
            selected={true}
          />
        </div>
      </div>
    </div>
  )
}

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
  render: () => <AllStatesComponent />,
}

/**
 * Interactive tab list with realistic selection behavior.
 * Click to select tabs - demonstrates real-world usage.
 */
type InteractiveListTab = {
  id: number
  title: string
  url: string
  color: string
  lastAccessed: number
  audio?: 'muted' | 'on' | 'off'
  duplicate?: boolean
}

const INTERACTIVE_LIST_TABS = (now: number): InteractiveListTab[] => [
  {
    id: 1,
    title: 'GitHub - microsoft/vscode',
    url: 'https://github.com/microsoft/vscode',
    color: '#24292e',
    lastAccessed: now - 5 * 60 * 1000,
  },
  {
    id: 2,
    title: 'Gmail - Inbox',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    color: '#EA4335',
    lastAccessed: now - 2 * 60 * 1000,
  },
  {
    id: 3,
    title: 'Google Docs - Project Plan',
    url: 'https://docs.google.com/document/d/abc123',
    color: '#4285F4',
    lastAccessed: now - 30 * 60 * 1000,
  },
  {
    id: 4,
    title: 'Stack Overflow - React Hooks',
    url: 'https://stackoverflow.com/questions/53945763',
    color: '#F48024',
    duplicate: true,
    lastAccessed: now - 2 * 60 * 60 * 1000,
  },
  {
    id: 5,
    title: 'YouTube - Music Video',
    url: 'https://youtube.com/watch?v=abc123',
    color: '#FF0000',
    audio: 'on',
    lastAccessed: now - 10 * 60 * 1000,
  },
  {
    id: 6,
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/',
    color: '#000000',
    lastAccessed: now - 24 * 60 * 60 * 1000,
  },
]

const InteractiveListComponent = () => {
  const [now] = useState(() => Date.now())
  const [tabs, setTabs] = useState<InteractiveListTab[]>(() =>
    INTERACTIVE_LIST_TABS(now),
  )
  const [nextId, setNextId] = useState(7)
  const [selectedId, setSelectedId] = useState<number | null>(2)
  const [activeId] = useState<number>(2)

  const handleClose = (tabId: number) => {
    setTabs((prev) => prev.filter((t) => t.id !== tabId))
    if (selectedId === tabId) setSelectedId(null)
  }

  const addTab = () => {
    const insertIndex = 2
    const newTab: InteractiveListTab = {
      id: nextId,
      title: `New Tab ${nextId}`,
      url: `https://example.com/tab-${nextId}`,
      color: '#10b981',
      lastAccessed: Date.now(),
    }
    const next = [...tabs]
    next.splice(insertIndex, 0, newTab)
    setTabs(next)
    setNextId((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="text-muted mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span>
          Click any tab to select it. Hover or focus and press Delete to close.
          Tab #2 is the active browser tab.
        </span>
        <button
          type="button"
          onClick={addTab}
          className={`
            bg-accent/10 rounded px-3 py-1
            hover:bg-accent/20
          `}
        >
          Add tab (at position 2)
        </button>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {tabs.map((tab) => (
          <BrowserTabItem
            key={tab.id}
            tabId={tab.id}
            title={tab.title}
            url={tab.url}
            favicon={<ColoredIcon color={tab.color} />}
            selected={selectedId === tab.id}
            active={activeId === tab.id}
            audio={tab.audio}
            duplicate={tab.duplicate}
            lastAccessed={tab.lastAccessed}
            onClick={() => setSelectedId(tab.id)}
            onClose={() => handleClose(tab.id)}
          />
        ))}
      </AnimatePresence>
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
          'Realistic multi-tab scenario. Click to select, Add tab to insert at position 2, close via X or Delete. Active tab (Gmail) has a bold border.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <InteractiveListComponent />,
}

/**
 * Edge cases and content variations.
 * Tests how the component handles unusual content lengths, missing data, and truncation.
 */
export const ContentVariations = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Demonstrates how the component handles edge cases: extremely long titles/URLs, missing data, and content truncation. All items are shown in a single vertical list as they would appear in the tab manager.',
      },
    },
  },
  decorators: [twoColumnDecorator],
  render: () => {
    const now = Date.now()
    const MIN = 60 * 1000
    const HOUR = 60 * MIN
    const DAY = 24 * HOUR
    const scenarios = [
      {
        description: 'long title',
        component: (
          <BrowserTabItem
            tabId={1}
            title="This is an extremely long tab title that should be truncated with an ellipsis when it exceeds the available width of the component"
            url="https://example.com/very/long/path/to/resource"
            favicon={<ColoredIcon color="#10b981" />}
            lastAccessed={now - 5 * MIN}
          />
        ),
      },
      {
        description: 'long url',
        component: (
          <BrowserTabItem
            tabId={2}
            title="Short Title"
            url="https://this-is-a-very-long-subdomain.example-domain-name.co.uk/path"
            favicon={<ColoredIcon color="#6366f1" />}
            lastAccessed={now - 2 * HOUR}
          />
        ),
      },
      {
        description: 'empty title',
        component: (
          <BrowserTabItem
            tabId={3}
            title=""
            url="http://localhost:3000"
            favicon={<ColoredIcon color="#6b7280" />}
            lastAccessed={now - 1 * DAY}
          />
        ),
      },
      {
        description: 'missing favicon',
        component: (
          <BrowserTabItem
            tabId={4}
            title="No Favicon Example"
            url="https://example.com"
            lastAccessed={now - 60 * DAY}
          />
        ),
      },
      {
        description: 'short title',
        component: (
          <BrowserTabItem
            tabId={5}
            title="Hi"
            url="https://example.com"
            favicon={<ColoredIcon color="#8B5CF6" />}
            lastAccessed={now - 365 * DAY}
          />
        ),
      },
      {
        description: 'unicode & emoji',
        component: (
          <BrowserTabItem
            tabId={6}
            title="🎉 Party Time! 🎊 (Unicode & Emoji)"
            url="https://example.com/party"
            favicon={<ColoredIcon color="#F59E0B" />}
            lastAccessed={now - 2 * 365 * DAY}
          />
        ),
      },
      {
        description: 'long url path',
        component: (
          <BrowserTabItem
            tabId={7}
            title="Deep Navigation"
            url="https://example.com/level1/level2/level3/level4/level5/level6/level7/level8/level9/level10/page"
            favicon={<ColoredIcon color="#EC4899" />}
            lastAccessed={now - 6 * 30 * DAY}
          />
        ),
      },
      {
        description: 'missing url',
        component: (
          <BrowserTabItem
            tabId={8}
            title="New Tab (no URL yet)"
            favicon={<ColoredIcon color="#6B7280" />}
            lastAccessed={now - 30 * MIN}
          />
        ),
      },
    ]

    return (
      <div className="grid grid-cols-[320px_auto] items-center gap-x-8 gap-y-1">
        {scenarios.map((scenario, index) => (
          <div key={index} className="contents">
            <div className="w-[320px]">{scenario.component}</div>
            <p className="text-muted whitespace-nowrap text-xs">
              {scenario.description}
            </p>
          </div>
        ))}
      </div>
    )
  },
}

// New compact API types
type Tab = {
  title: string
  url: string
  color: string
  lastAccessed?: number
  /** Ms before scenario start when tab was last accessed (negative). Used for initial lastAccessed. */
  lastAccessedOffsetMs?: number
}

type InitialState = {
  tabs: Tab[]
  hover?: number
  focus?: number
  selected: number[]
  active: number
  pinned?: number[]
  discarded?: number[]
  loading?: number[]
  blurred?: number[]
  visible?: number[]
  audio?: Record<number, 'muted' | 'on' | 'off'>
  duplicate?: number[]
}

type Action = {
  ms: number
  label?: string
  hover?: number | null
  focus?: number | null
  selected?: number[]
  active?: number
  pinned?: number[]
  discarded?: number[]
  loading?: number[]
  blurred?: number[]
  visible?: number[]
  audio?: Record<number, 'muted' | 'on' | 'off'>
  duplicate?: number[]
}

type Step = Action[]

type CompactScenarioConfig = {
  initial: InitialState
  steps: Step[]
  endPadding?: number
}

// Compiled/runtime types (what WorkflowDemo expects)
type CompiledAction = {
  timestamp: number
  state: {
    hover?: number | null
    focus?: number | null
    selected: number[]
    active: number
    loading?: number[]
    blurred?: number[]
    pinned?: number[]
    discarded?: number[]
    visible?: number[]
    audio?: Record<number, 'muted' | 'on' | 'off'>
    duplicate?: number[]
    /** tab id -> scenario timestamp (ms) when that tab was last accessed */
    lastAccessed?: Record<number, number>
  }
}

type CompiledStep = {
  label: string
  startTime: number
  endTime: number
  actions: CompiledAction[]
}

type CompiledScenarioConfig = {
  tabs: Tab[]
  steps: CompiledStep[]
  totalDuration: number
}

// Compiler function
const compileScenario = (
  config: CompactScenarioConfig,
): CompiledScenarioConfig => {
  const { initial, steps, endPadding = 1000 } = config

  // Build initial state
  let currentState = {
    hover: initial.hover,
    focus: initial.focus,
    selected: initial.selected,
    active: initial.active,
    loading: initial.loading,
    blurred: initial.blurred,
    pinned: initial.pinned,
    discarded: initial.discarded,
    visible: initial.visible,
    audio: initial.audio,
    duplicate: initial.duplicate,
  }

  const compiledSteps: CompiledStep[] = []
  let cumulativeTime = 0

  // Bootstrap lastAccessed: all tabs get initial offset from config; overwrite with 0 for initially selected
  const lastAccessedMap: Record<number, number> = {}
  initial.tabs.forEach((tab, idx) => {
    const id = idx + 1
    const offset = tab.lastAccessedOffsetMs ?? 0
    lastAccessedMap[id] = offset
  })
  initial.selected.forEach((id) => {
    lastAccessedMap[id] = 0
  })
  let prevSelected = initial.selected

  // Compile each step
  steps.forEach((step, stepIndex) => {
    const compiledActions: CompiledAction[] = []
    const stepLabel =
      step.find((a) => a.label)?.label || `Step ${stepIndex + 1}`
    const stepStartTime = cumulativeTime

    step.forEach((action) => {
      // Merge with previous state (state diffing)
      currentState = {
        ...currentState,
        ...(action.hover !== undefined && {
          hover: action.hover ?? undefined,
        }),
        ...(action.focus !== undefined && {
          focus: action.focus ?? undefined,
        }),
        ...(action.selected !== undefined && { selected: action.selected }),
        ...(action.active !== undefined && { active: action.active }),
        ...(action.loading !== undefined && { loading: action.loading }),
        ...(action.blurred !== undefined && { blurred: action.blurred }),
        ...(action.pinned !== undefined && { pinned: action.pinned }),
        ...(action.discarded !== undefined && {
          discarded: action.discarded,
        }),
        ...(action.visible !== undefined && { visible: action.visible }),
        ...(action.audio !== undefined && { audio: action.audio }),
        ...(action.duplicate !== undefined && { duplicate: action.duplicate }),
      }

      // Compute "accessed" tab when selection changes; update lastAccessed map
      if (action.selected !== undefined) {
        const curr = currentState.selected
        const added = curr.filter((id) => !prevSelected.includes(id))
        const removed = prevSelected.filter((id) => !curr.includes(id))

        let accessed: number | null = null
        if (curr.length === 1 && removed.length > 0) {
          accessed = curr[0]!
        } else if (added.length === 1) {
          accessed = added[0]!
        } else if (added.length > 1) {
          const target = currentState.hover ?? currentState.focus ?? null
          accessed = target && added.includes(target) ? target : added[0]!
        } else if (
          prevSelected.length === 1 &&
          curr.length === 1 &&
          prevSelected[0] !== curr[0]
        ) {
          accessed = curr[0]!
        }

        if (accessed !== null) {
          lastAccessedMap[accessed] = cumulativeTime
        }
        prevSelected = curr
      }

      compiledActions.push({
        timestamp: cumulativeTime,
        state: { ...currentState, lastAccessed: { ...lastAccessedMap } },
      })

      // Display this state for the specified duration
      cumulativeTime += action.ms
    })

    const stepEndTime = cumulativeTime

    compiledSteps.push({
      label: stepLabel,
      startTime: stepStartTime,
      endTime: stepEndTime,
      actions: compiledActions,
    })
  })

  // Add final padding
  const totalDuration = cumulativeTime + endPadding

  return {
    tabs: initial.tabs,
    steps: compiledSteps,
    totalDuration,
  }
}

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const SHARED_TABS: Tab[] = [
  {
    title: '(3) Gmail - Inbox',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    color: '#EA4335',
    lastAccessedOffsetMs: -5 * MIN,
  },
  {
    title: 'YouTube - Music Video',
    url: 'https://youtube.com/watch?v=abc123',
    color: '#FF0000',
    lastAccessedOffsetMs: -2 * HOUR,
  },
  {
    title: 'Google Docs - Project Plan',
    url: 'https://docs.google.com/document/d/abc123',
    color: '#4285F4',
    lastAccessedOffsetMs: -1 * DAY,
  },
  {
    title: 'Stack Overflow - React Hooks',
    url: 'https://stackoverflow.com/questions/53945763',
    color: '#F48024',
    lastAccessedOffsetMs: -60 * DAY,
  },
  {
    title: 'New Tab',
    url: 'chrome://newtab',
    color: '#8B5CF6',
    lastAccessedOffsetMs: -365 * DAY,
  },
  {
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/',
    color: '#000000',
    lastAccessedOffsetMs: -2 * 365 * DAY,
  },
  {
    title: 'Google Docs - Project Plan',
    url: 'https://docs.google.com/document/d/abc123',
    color: '#4285F4',
    lastAccessedOffsetMs: -60 * DAY,
  },
]

const MOUSE_SCENARIO: CompactScenarioConfig = {
  initial: {
    tabs: SHARED_TABS,
    hover: 2,
    selected: [2],
    active: 2,
    discarded: [3],
    visible: [1, 2, 3, 4, 6, 7],
    audio: { 2: 'on' },
    duplicate: [3, 7],
  },
  steps: [
    [
      { ms: 1500, label: 'Pin tab 1', hover: 1 },
      { ms: 400, active: 1, selected: [1] },
      { ms: 600, pinned: [1] },
    ],
    [
      { ms: 600, label: 'Mute audio on tab 2', hover: 2 },
      { ms: 400, active: 2, selected: [2] },
      { ms: 600, audio: { 2: 'muted' } },
    ],
    [
      { ms: 500, label: 'Click tab 4 to activate', hover: 2 },
      { ms: 400, hover: 3 },
      { ms: 400, hover: 4 },
      { ms: 700, active: 4, selected: [4] },
    ],
    [
      { ms: 500, label: 'Shift+Click tab 1 to select range', hover: 3 },
      { ms: 400, hover: 2 },
      { ms: 400, hover: 1 },
      { ms: 600, active: 1, selected: [1, 2, 3, 4] },
    ],
    [
      { ms: 600, label: 'Open new tab', hover: 1 },
      {
        ms: 800,
        active: 5,
        selected: [5],
        loading: [5],
        blurred: [5],
        visible: [1, 2, 3, 4, 5, 6, 7],
      },
      { ms: 700, loading: [], blurred: [] },
    ],
    [
      { ms: 800, label: 'Close new tab', hover: 1 },
      { ms: 800, active: 1, selected: [1], visible: [1, 2, 3, 4, 6, 7] },
    ],
    [
      { ms: 750, label: 'Unpin tab 1' },
      { ms: 750, pinned: [] },
    ],
    [
      { ms: 750, label: 'Return to tab 2', hover: 2 },
      { ms: 750, active: 2, selected: [2] },
      { ms: 600, label: 'Unmute audio', audio: { 2: 'on' } },
    ],
  ],
}

const KEYBOARD_SCENARIO: CompactScenarioConfig = {
  initial: {
    tabs: SHARED_TABS,
    focus: 2,
    selected: [2],
    active: 2,
    discarded: [3],
    visible: [1, 2, 3, 4, 6, 7],
    audio: { 2: 'on' },
    duplicate: [3, 7],
  },
  steps: [
    [
      { ms: 1500, label: 'Press ↑ to tab 1, pin it' },
      { ms: 400, active: 1, selected: [1], focus: 1 },
      { ms: 600, pinned: [1] },
    ],
    [
      { ms: 600, label: 'Mute audio on tab 2', focus: 2 },
      { ms: 400, active: 2, selected: [2] },
      { ms: 600, audio: { 2: 'muted' } },
    ],
    [
      { ms: 500, label: 'Press ↓ three times to reach tab 4' },
      { ms: 400, active: 2, selected: [2], focus: 2 },
      { ms: 500, active: 3, selected: [3], focus: 3, discarded: [] },
      { ms: 600, active: 4, selected: [4], focus: 4 },
    ],
    [
      { ms: 500, label: 'Shift+↑ three times to select range' },
      { ms: 400, active: 3, selected: [3, 4], focus: 3 },
      { ms: 500, active: 2, selected: [2, 3, 4], focus: 2 },
      { ms: 500, active: 1, selected: [1, 2, 3, 4], focus: 1 },
    ],
    [
      { ms: 600, label: 'Open new tab with Cmd+T' },
      {
        ms: 800,
        active: 5,
        selected: [5],
        focus: 5,
        loading: [5],
        blurred: [5],
        visible: [1, 2, 3, 4, 5, 6, 7],
      },
      { ms: 700, loading: [], blurred: [] },
    ],
    [
      { ms: 800, label: 'Close new tab with Cmd+W' },
      {
        ms: 750,
        active: 1,
        selected: [1],
        focus: 1,
        visible: [1, 2, 3, 4, 6, 7],
      },
    ],
    [
      { ms: 750, label: 'Unpin tab 1' },
      { ms: 750, pinned: [] },
    ],
    [
      { ms: 750, label: 'Press ↓ to return to tab 2' },
      { ms: 750, active: 2, selected: [2], focus: 2 },
      { ms: 600, label: 'Unmute audio', audio: { 2: 'on' } },
    ],
  ],
}

const WorkflowDemo = ({
  scenario,
  showCursor = false,
}: {
  scenario: CompactScenarioConfig
  showCursor?: boolean
}) => {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const tabListRef = useRef<HTMLDivElement>(null)
  const [now] = useState(() => Date.now())

  // Compile the compact scenario into runtime format
  const compiled = useMemo(() => compileScenario(scenario), [scenario])
  const { tabs, steps: compiledSteps, totalDuration } = compiled

  // Find current action and step based on time
  const allActions = compiledSteps.flatMap((step) => step.actions)
  const currentAction = allActions.reduce(
    (prev, curr) => (currentTime >= curr.timestamp ? curr : prev),
    allActions[0]!,
  )

  const currentStep =
    compiledSteps.find(
      (step) => currentTime >= step.startTime && currentTime < step.endTime,
    ) || compiledSteps[compiledSteps.length - 1]!

  // Filter tabs based on visible if provided
  const visible = currentAction?.state.visible
  const visibleTabs = visible
    ? tabs.filter((_, idx) => visible.includes(idx + 1))
    : tabs

  useEffect(() => {
    if (!isPlaying) return

    const startTimestamp = Date.now() - currentTime
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimestamp

      if (elapsed >= totalDuration) {
        setCurrentTime(0)
      } else {
        setCurrentTime(elapsed)
      }
    }, 16) // 60fps

    return () => clearInterval(timer)
  }, [isPlaying, currentTime, totalDuration])

  // Update cursor position for mouse demo
  useEffect(() => {
    if (!showCursor || !tabListRef.current) return

    const hovered = currentAction?.state.hover
    if (!hovered) return

    const tabElement = tabListRef.current.querySelector(
      `[data-tab-id="${hovered}"]`,
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
    const targetTime = percent * totalDuration

    // Find which section was clicked
    const clickedStep =
      compiledSteps.find(
        (step) => targetTime >= step.startTime && targetTime < step.endTime,
      ) || compiledSteps[compiledSteps.length - 1]!

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
            {compiledSteps.map((step, idx) => {
              const segmentWidth =
                ((step.endTime - step.startTime) / totalDuration) * 100
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
                  {idx < compiledSteps.length - 1 && (
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
        {showCursor && currentAction?.state.hover && (
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

        <AnimatePresence mode="sync" initial={false}>
          {visibleTabs.map((tab, idx) => {
            const tabId = visible ? visible[idx]! : idx + 1
            const isHovered = currentAction?.state.hover === tabId
            const isFocused = currentAction?.state.focus === tabId
            const isSelected =
              currentAction?.state.selected.includes(tabId) || false
            const isActive = currentAction?.state.active === tabId
            const isLoading =
              currentAction?.state.loading?.includes(tabId) || false
            const isBlurred =
              currentAction?.state.blurred?.includes(tabId) || false
            const isPinned =
              currentAction?.state.pinned?.includes(tabId) || false
            const isDiscarded =
              currentAction?.state.discarded?.includes(tabId) || false
            const audioState = currentAction?.state.audio?.[tabId]
            const isDuplicate =
              currentAction?.state.duplicate?.includes(tabId) || false
            const accessTs = currentAction?.state.lastAccessed?.[tabId]
            const lastAccessed =
              accessTs !== undefined
                ? now - (currentTime - accessTs)
                : undefined

            return (
              <BrowserTabItem
                key={tabId}
                tabId={tabId}
                title={tab.title}
                url={tab.url}
                favicon={<ColoredIcon color={tab.color} />}
                selected={isSelected}
                active={isActive}
                loading={isLoading}
                blurred={isBlurred}
                pinned={isPinned}
                discarded={isDiscarded}
                audio={audioState}
                duplicate={isDuplicate}
                lastAccessed={lastAccessed}
                onClose={() => {}}
                data-hover={isHovered || undefined}
                data-focus={isFocused || undefined}
                data-tab-id={tabId}
              />
            )
          })}
        </AnimatePresence>
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

/**
 * Side-by-side comparison: left uses your system preference (prefers-reduced-motion),
 * right always has reduced motion forced.
 */
const ReducedMotionComparisonComponent = () => {
  const [now] = useState(() => Date.now())
  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Normal Motion */}
      <div className="flex flex-col gap-4" data-force-reduced-motion="false">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Normal Motion
        </h2>
        <p className="text-muted text-xs">
          Spring animations. Updates every second.
        </p>
        <BrowserTabItem
          tabId={1}
          title="GitHub - microsoft/vscode"
          url="https://github.com/microsoft/vscode"
          favicon={<ColoredIcon color="#24292e" />}
          lastAccessed={now}
          loading={true}
          active
        />
      </div>

      {/* Reduced motion (always) */}
      <div className="flex flex-col gap-4" data-force-reduced-motion="true">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Reduced motion
        </h2>
        <p className="text-muted text-xs">
          Linear animations. Updates every minute.
        </p>
        <BrowserTabItem
          tabId={2}
          title="GitHub - microsoft/vscode"
          url="https://github.com/microsoft/vscode"
          favicon={<ColoredIcon color="#24292e" />}
          lastAccessed={now}
          loading={true}
          active
        />
      </div>
    </div>
  )
}

export const ReducedMotionComparison = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: 'Compare normal vs reduced motion.',
      },
    },
  },
  decorators: [twoColumnDecorator],
  render: () => <ReducedMotionComparisonComponent />,
}
