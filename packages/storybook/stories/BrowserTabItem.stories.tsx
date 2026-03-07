import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Decorator, Meta, StoryObj } from '@storybook/react'

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
