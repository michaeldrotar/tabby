import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { useEffect, useRef, useState } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import type { MouseEvent } from 'react'

// Simple colored icon for demonstration
const ColoredIcon = ({ color }: { color: string }) => (
  <div className="h-5 w-5 rounded" style={{ backgroundColor: color }} />
)

const maxWidthXsDecorator: Decorator = (Story) => (
  <div className="flex w-full max-w-xs flex-col gap-2 p-4">
    <Story />
  </div>
)

const maxWidth2xlDecorator: Decorator = (Story) => (
  <div className="flex w-full max-w-2xl flex-col gap-2 p-4">
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
  decorators: [maxWidthXsDecorator],
}

/**
 * All interactive states displayed side by side.
 * Shows all possible state combinations for visual comparison.
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
  decorators: [maxWidth2xlDecorator],
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
  decorators: [maxWidthXsDecorator],
  render: () => <InteractiveListComponent />,
}

/**
 * Edge cases and content variations.
 */
export const ContentVariations = {
  parameters: {
    controls: { disable: true },
  },
  decorators: [maxWidthXsDecorator],
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
  totalDuration: 9000,
  steps: [
    {
      label: 'Starting state - Gmail is active',
      startTime: 0,
      endTime: 1000,
      actions: [{ timestamp: 0, state: { selectedIds: [], activeId: 2 } }],
    },
    {
      label: 'Select GitHub tab',
      startTime: 1000,
      endTime: 4000,
      actions: [
        {
          timestamp: 1000,
          state: { hoverId: 1, selectedIds: [], activeId: 2 },
        },
        {
          timestamp: 2200,
          state: { hoverId: 1, selectedIds: [1], activeId: 2 },
        },
      ],
    },
    {
      label: 'Move cursor to Stack Overflow tab',
      startTime: 4000,
      endTime: 7000,
      actions: [
        {
          timestamp: 4000,
          state: { hoverId: 2, selectedIds: [1], activeId: 2 },
        },
        {
          timestamp: 6000,
          state: { hoverId: 4, selectedIds: [1, 2, 3, 4], activeId: 2 },
        },
      ],
    },
    {
      label: 'Double-click Stack Overflow to activate',
      startTime: 7000,
      endTime: 9000,
      actions: [
        {
          timestamp: 7200,
          state: { hoverId: 4, selectedIds: [], activeId: 4 },
        },
      ],
    },
  ],
}

const KEYBOARD_SCENARIO: ScenarioConfig = {
  totalDuration: 7500,
  steps: [
    {
      label: 'Starting state - Gmail has focus',
      startTime: 0,
      endTime: 1000,
      actions: [
        { timestamp: 0, state: { selectedIds: [], activeId: 2, focusId: 2 } },
      ],
    },
    {
      label: 'Press ↓ to navigate down',
      startTime: 1000,
      endTime: 3500,
      actions: [
        {
          timestamp: 1000,
          state: { selectedIds: [], activeId: 2, focusId: 3 },
        },
        {
          timestamp: 2000,
          state: { selectedIds: [], activeId: 2, focusId: 4 },
        },
      ],
    },
    {
      label: 'Press Space to select items',
      startTime: 3500,
      endTime: 6000,
      actions: [
        {
          timestamp: 3500,
          state: { selectedIds: [4], activeId: 2, focusId: 4 },
        },
        {
          timestamp: 4500,
          state: { selectedIds: [4], activeId: 2, focusId: 3 },
        },
        {
          timestamp: 5500,
          state: { selectedIds: [3, 4], activeId: 2, focusId: 3 },
        },
      ],
    },
    {
      label: 'Press Enter to activate selected tab',
      startTime: 6000,
      endTime: 7500,
      actions: [
        {
          timestamp: 6000,
          state: { selectedIds: [], activeId: 3, focusId: 3 },
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
        <div className="flex flex-1 flex-col gap-2">
          {/* Current Step Label */}
          <div className="text-foreground text-sm font-medium">
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

        {tabs.map((tab) => {
          const isHovered = currentAction?.state.hoverId === tab.id
          const isFocused = currentAction?.state.focusId === tab.id
          const isSelected =
            currentAction?.state.selectedIds.includes(tab.id) || false
          const isActive = currentAction?.state.activeId === tab.id

          return (
            <BrowserTabItem
              key={tab.id}
              tabId={tab.id}
              title={tab.title}
              url={tab.url}
              favicon={<ColoredIcon color={tab.color} />}
              selected={isSelected}
              active={isActive}
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
 * Shows how users interact with tabs using a mouse.
 */
export const MouseWorkflow = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Simulates a realistic mouse workflow with a visible cursor: hovering over tabs, selecting with clicks, multi-selecting with Shift+Click, and switching active tabs.',
      },
    },
  },
  decorators: [maxWidthXsDecorator],
  render: () => <WorkflowDemo scenario={MOUSE_SCENARIO} showCursor />,
}

/**
 * Demonstrates keyboard navigation workflow with arrow keys, Space, and Enter.
 * Shows accessible keyboard-driven interaction patterns.
 */
export const KeyboardWorkflow = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Simulates keyboard navigation: arrow keys to move focus, Space to select, Enter to activate. Demonstrates accessible keyboard-driven workflow for power users.',
      },
    },
  },
  decorators: [maxWidthXsDecorator],
  render: () => <WorkflowDemo scenario={KEYBOARD_SCENARIO} />,
}
