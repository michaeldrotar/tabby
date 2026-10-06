import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { BrowserTabList } from '@extension/ui/BrowserTabList'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Decorator, Meta } from '@storybook/react'
import type { MouseEvent } from 'react'

const ColoredIcon = ({ color }: { color: string }) => (
  <div className="h-5 w-5 rounded" style={{ backgroundColor: color }} />
)

const singleColumnDecorator: Decorator = (Story) => (
  <div className="flex w-[320px] max-w-full flex-col gap-2 p-4">
    <Story />
  </div>
)

const meta = {
  title: 'Tab Manager/BrowserTabList',
  component: BrowserTabList,
  parameters: {
    layout: 'centered',
  },
  tags: [],
} satisfies Meta<typeof BrowserTabList>

export default meta

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

  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        type: 'tab' as const,
        tab: {
          id: tab.id,
          title: tab.title,
          url: tab.url,
          favicon: <ColoredIcon color={tab.color} />,
          active: activeId === tab.id,
          audio: tab.audio,
          lastAccessed: tab.lastAccessed,
        },
      })),
    [activeId, tabs],
  )

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
      <BrowserTabList
        items={items}
        selectedTabIds={new Set(selectedId ? [selectedId] : [])}
        duplicateTabIds={
          new Set(tabs.filter((tab) => tab.duplicate).map((tab) => tab.id))
        }
        onTabClick={(tab) => setSelectedId(tab.id as number)}
        onTabClose={(tab) => handleClose(tab.id as number)}
      />
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

type Tab = {
  title: string
  url: string
  color: string
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

const compileScenario = (
  config: CompactScenarioConfig,
): CompiledScenarioConfig => {
  const { initial, steps, endPadding = 1000 } = config

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

  const lastAccessedMap: Record<number, number> = {}
  initial.tabs.forEach((tab, idx) => {
    const id = idx + 1
    lastAccessedMap[id] = tab.lastAccessedOffsetMs ?? 0
  })
  initial.selected.forEach((id) => {
    lastAccessedMap[id] = 0
  })
  let prevSelected = initial.selected

  steps.forEach((step, stepIndex) => {
    const compiledActions: CompiledAction[] = []
    const stepLabel =
      step.find((a) => a.label)?.label || `Step ${stepIndex + 1}`
    const stepStartTime = cumulativeTime

    step.forEach((action) => {
      currentState = {
        ...currentState,
        ...(action.hover !== undefined && { hover: action.hover ?? undefined }),
        ...(action.focus !== undefined && { focus: action.focus ?? undefined }),
        ...(action.selected !== undefined && { selected: action.selected }),
        ...(action.active !== undefined && { active: action.active }),
        ...(action.loading !== undefined && { loading: action.loading }),
        ...(action.blurred !== undefined && { blurred: action.blurred }),
        ...(action.pinned !== undefined && { pinned: action.pinned }),
        ...(action.discarded !== undefined && { discarded: action.discarded }),
        ...(action.visible !== undefined && { visible: action.visible }),
        ...(action.audio !== undefined && { audio: action.audio }),
        ...(action.duplicate !== undefined && { duplicate: action.duplicate }),
      }

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
      cumulativeTime += action.ms
    })

    compiledSteps.push({
      label: stepLabel,
      startTime: stepStartTime,
      endTime: cumulativeTime,
      actions: compiledActions,
    })
  })

  return {
    tabs: initial.tabs,
    steps: compiledSteps,
    totalDuration: cumulativeTime + endPadding,
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

  const compiled = useMemo(() => compileScenario(scenario), [scenario])
  const { tabs, steps: compiledSteps, totalDuration } = compiled

  const allActions = compiledSteps.flatMap((step) => step.actions)
  const currentAction = allActions.reduce(
    (prev, curr) => (currentTime >= curr.timestamp ? curr : prev),
    allActions[0]!,
  )

  const currentStep =
    compiledSteps.find(
      (step) => currentTime >= step.startTime && currentTime < step.endTime,
    ) || compiledSteps[compiledSteps.length - 1]!

  const visible = currentAction?.state.visible
  const visibleTabs = visible
    ? tabs.filter((_, idx) => visible.includes(idx + 1))
    : tabs

  const items = useMemo(
    () =>
      visibleTabs.map((tab, idx) => {
        const tabId = visible ? visible[idx]! : idx + 1
        const accessTs = currentAction?.state.lastAccessed?.[tabId]
        return {
          type: 'tab' as const,
          tab: {
            id: tabId,
            title: tab.title,
            url: tab.url,
            favicon: <ColoredIcon color={tab.color} />,
            active: currentAction?.state.active === tabId,
            loading: currentAction?.state.loading?.includes(tabId) || false,
            blurred: currentAction?.state.blurred?.includes(tabId) || false,
            pinned: currentAction?.state.pinned?.includes(tabId) || false,
            discarded: currentAction?.state.discarded?.includes(tabId) || false,
            audio: currentAction?.state.audio?.[tabId],
            lastAccessed:
              accessTs !== undefined
                ? now - (currentTime - accessTs)
                : undefined,
          },
        }
      }),
    [currentAction, currentTime, now, visible, visibleTabs],
  )

  useEffect(() => {
    if (!isPlaying) return

    const startTimestamp = Date.now() - currentTime
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimestamp
      setCurrentTime(elapsed >= totalDuration ? 0 : elapsed)
    }, 16)

    return () => clearInterval(timer)
  }, [isPlaying, currentTime, totalDuration])

  useEffect(() => {
    if (!showCursor || !tabListRef.current) return
    const hovered = currentAction?.state.hover
    if (!hovered) return

    const tabElement = tabListRef.current.querySelector(
      `[data-tab-id="${hovered}"]`,
    )
    if (!tabElement) return

    const rect = tabElement.getBoundingClientRect()
    const listRect = tabListRef.current.getBoundingClientRect()
    setCursorPos({
      x: rect.left - listRect.left + rect.width / 2,
      y: rect.top - listRect.top + rect.height / 2,
    })
  }, [currentAction, showCursor])

  const handleProgressClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const targetTime = (x / rect.width) * totalDuration
    const clickedStep =
      compiledSteps.find(
        (step) => targetTime >= step.startTime && targetTime < step.endTime,
      ) || compiledSteps[compiledSteps.length - 1]!
    setCurrentTime(clickedStep.startTime)
    setIsPlaying(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying((prev) => !prev)}
          className={`
            text-muted flex-shrink-0 text-xl transition-colors
            hover:text-foreground
          `}
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div
            className={`
              text-foreground min-h-[1.25rem] min-w-0 text-sm font-medium
            `}
          >
            {currentStep.label}
          </div>
          <button
            type="button"
            className={`
              group relative flex h-2 w-full cursor-pointer overflow-hidden
              rounded-full
            `}
            onClick={handleProgressClick}
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
                  <div
                    className={`
                      bg-muted/50 h-full transition-colors
                      group-hover:bg-muted
                    `}
                  />
                  {(isActive || isPast) && (
                    <div
                      className="bg-accent absolute left-0 top-0 h-full"
                      style={{
                        width: isPast ? '100%' : `${progressInSegment}%`,
                        transition: isPlaying ? 'none' : 'width 0.2s ease-out',
                      }}
                    />
                  )}
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

      <div ref={tabListRef} className="relative">
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

        <BrowserTabList
          items={items}
          selectedTabIds={new Set(currentAction?.state.selected ?? [])}
          duplicateTabIds={new Set(currentAction?.state.duplicate ?? [])}
          isMultiSelectMode={(currentAction?.state.selected.length ?? 0) > 1}
          renderTabItem={({
            tab,
            selected,
            duplicate,
            isMultiSelectMode,
            onClick,
            onClose,
          }) => (
            <BrowserTabItem
              tabId={tab.id}
              title={tab.title}
              url={tab.url}
              favicon={tab.favicon}
              selected={selected}
              active={tab.active}
              loading={tab.loading}
              blurred={tab.blurred}
              pinned={tab.pinned}
              discarded={tab.discarded}
              audio={tab.audio}
              duplicate={duplicate}
              lastAccessed={tab.lastAccessed}
              isMultiSelectMode={isMultiSelectMode}
              onClick={onClick}
              onClose={onClose}
              data-hover={
                currentAction?.state.hover === (tab.id as number) || undefined
              }
              data-focus={
                currentAction?.state.focus === (tab.id as number) || undefined
              }
            />
          )}
          onTabClose={() => {}}
        />
      </div>
    </div>
  )
}

export const MouseWorkflow = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Simulates realistic mouse interactions with list-level state and timeline playback.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <WorkflowDemo scenario={MOUSE_SCENARIO} showCursor />,
}

export const KeyboardWorkflow = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Simulates keyboard navigation workflow with list-level focus and selection transitions.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  render: () => <WorkflowDemo scenario={KEYBOARD_SCENARIO} />,
}
