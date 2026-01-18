import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
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
    loading: false,
    blurred: false,
    pinned: false,
    discarded: false,
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
          <BrowserTabItem
            tabId={12}
            title="GitHub - microsoft/vscode"
            url="https://github.com/microsoft/vscode"
            favicon={<ColoredIcon color="#24292e" />}
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
            loading={true}
            blurred={true}
            active={true}
            selected={true}
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

// New compact API types
type Tab = {
  title: string
  url: string
  color: string
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
  }

  const compiledSteps: CompiledStep[] = []
  let cumulativeTime = 0

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
      }

      compiledActions.push({
        timestamp: cumulativeTime,
        state: { ...currentState },
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

const SHARED_TABS: Tab[] = [
  {
    title: 'GitHub - microsoft/vscode',
    url: 'https://github.com/microsoft/vscode',
    color: '#24292e',
  },
  {
    title: 'Gmail - Inbox',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    color: '#EA4335',
  },
  {
    title: 'Google Docs - Project Plan',
    url: 'https://docs.google.com/document/d/abc123',
    color: '#4285F4',
  },
  {
    title: 'Stack Overflow - React Hooks',
    url: 'https://stackoverflow.com/questions/53945763',
    color: '#F48024',
  },
  { title: 'New Tab', url: 'chrome://newtab', color: '#8B5CF6' },
  {
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/',
    color: '#000000',
  },
]

const MOUSE_SCENARIO: CompactScenarioConfig = {
  initial: {
    tabs: SHARED_TABS,
    hover: 2,
    selected: [2],
    active: 2,
    discarded: [3],
    visible: [1, 2, 3, 4, 6],
  },
  steps: [
    [
      { ms: 1500, label: 'Pin tab 1', hover: 1 },
      { ms: 400, active: 1, selected: [1] },
      { ms: 600, pinned: [1] },
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
        visible: [1, 2, 3, 4, 5, 6],
      },
      { ms: 700, loading: [], blurred: [] },
    ],
    [
      { ms: 800, label: 'Close new tab', hover: 1 },
      { ms: 800, active: 1, selected: [1], visible: [1, 2, 3, 4, 6] },
    ],
    [
      { ms: 750, label: 'Unpin tab 1' },
      { ms: 750, pinned: [] },
    ],
    [
      { ms: 750, label: 'Return to tab 2', hover: 2 },
      { ms: 750, active: 2, selected: [2] },
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
    visible: [1, 2, 3, 4, 6],
  },
  steps: [
    [
      { ms: 1500, label: 'Press ↑ to tab 1, pin it' },
      { ms: 400, active: 1, selected: [1], focus: 1 },
      { ms: 600, pinned: [1] },
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
        visible: [1, 2, 3, 4, 5, 6],
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
        visible: [1, 2, 3, 4, 6],
      },
    ],
    [
      { ms: 750, label: 'Unpin tab 1' },
      { ms: 750, pinned: [] },
    ],
    [
      { ms: 750, label: 'Press ↓ to return to tab 2' },
      { ms: 750, active: 2, selected: [2], focus: 2 },
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
 * Side-by-side comparison of normal animations vs reduced motion
 */
const ReducedMotionComparisonComponent = () => {
  const [loading, setLoading] = useState(true)
  const [blurred, setBlurred] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading((prev) => {
        if (!prev) {
          setBlurred(true)
          return true
        }
        if (blurred) {
          setBlurred(false)
          return true
        }
        return false
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [blurred])

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Normal Motion */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Normal Motion
        </h2>
        <p className="text-muted text-xs">
          Full animations with spring physics
        </p>
        <BrowserTabItem
          tabId={1}
          title="GitHub - microsoft/vscode"
          url="https://github.com/microsoft/vscode"
          favicon={<ColoredIcon color="#24292e" />}
          loading={loading}
          active
        />
      </div>

      {/* Reduced Motion */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Reduced Motion
        </h2>
        <p className="text-muted text-xs">
          Simplified animations (simulated with CSS class)
        </p>
        <div className="motion-reduce">
          <BrowserTabItem
            tabId={2}
            title="GitHub - microsoft/vscode"
            url="https://github.com/microsoft/vscode"
            favicon={<ColoredIcon color="#24292e" />}
            loading={loading}
            active
          />
        </div>
      </div>
    </div>
  )
}

export const ReducedMotionComparison = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Compare normal animations with reduced motion. Left shows full spring-based animations, right shows simplified version for users with motion sensitivity.',
      },
    },
  },
  decorators: [twoColumnDecorator],
  render: () => <ReducedMotionComparisonComponent />,
}

/**
 * Animated list with add/remove demonstrating layout animations
 */
const AnimatedListComponent = () => {
  const [tabs, setTabs] = useState([
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
  ])
  const [nextId, setNextId] = useState(4)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const addTab = () => {
    const insertIndex = 2 // Add in middle to show layout shift
    const newTab = {
      id: nextId,
      title: `New Tab ${nextId}`,
      url: `https://example.com/tab-${nextId}`,
      color: '#10b981',
    }
    const newTabs = [...tabs]
    newTabs.splice(insertIndex, 0, newTab)
    setTabs(newTabs)
    setNextId(nextId + 1)
  }

  const removeTab = (id: number) => {
    setTabs(tabs.filter((tab) => tab.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={addTab}
          className={`
            bg-accent/10 rounded px-3 py-1 text-xs
            hover:bg-accent/20
          `}
          type="button"
        >
          Add Tab (at position 2)
        </button>
        <p className="text-muted text-xs">
          Watch items smoothly shift to make room
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {tabs.map((tab) => (
          <BrowserTabItem
            key={tab.id}
            tabId={tab.id}
            title={tab.title}
            url={tab.url}
            favicon={<ColoredIcon color={tab.color} />}
            selected={selectedId === tab.id}
            onClick={() => {
              if (selectedId === tab.id) {
                removeTab(tab.id)
              } else {
                setSelectedId(tab.id)
              }
            }}
          />
        ))}
      </AnimatePresence>

      <p className="text-muted text-xs">
        Click a tab to select it. Click selected tab to remove it.
      </p>
    </div>
  )
}

export const AnimatedList = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Demonstrates smooth list animations when adding/removing tabs. Items shift gracefully to make room for new tabs using Framer Motion layout animations.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <AnimatedListComponent />,
}
