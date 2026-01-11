import { TabItemRow } from '@extension/ui/tab-manager/ui/TabItemRow'
import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

// Simple colored icon component for demos
const Icon = ({ color }: { color: string }) => (
  <div
    className={`
      h-5 w-5 rounded transition-transform
      group-hover:scale-110
    `}
    style={{ backgroundColor: color }}
  />
)

const meta = {
  title: 'Tab Manager/TabItemRow',
  component: TabItemRow,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onActivate: { action: 'activate' },
    onSelect: { action: 'select' },
    onClose: { action: 'close' },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabItemRow>

export default meta
type Story = StoryObj<typeof meta>

// Basic interactive story
export const Default: Story = {
  args: {
    tabId: 1,
    title: 'GitHub - microsoft/vscode',
    icon: Icon({ color: '#3b82f6' }),
    isActive: false,
    isHighlighted: false,
    isPinned: false,
    isMuted: false,
    isAudible: false,
    isDiscarded: false,
    selected: false,
    isMultiSelectMode: false,
    onActivate: () => console.log('Activated'),
    onSelect: () => console.log('Selected'),
    onClose: () => console.log('Closed'),
  },
}

// All visual states side-by-side
export const AllStates: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <div className="mb-1 text-xs font-semibold text-gray-400">Default</div>
      <TabItemRow
        tabId={1}
        title="Documentation - MDN Web Docs"
        icon={Icon({ color: '#ef4444' })}
        isActive={false}
        isHighlighted={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Active Tab
      </div>
      <TabItemRow
        tabId={2}
        title="React - A JavaScript library for building UIs"
        icon={Icon({ color: '#10b981' })}
        isActive={true}
        isHighlighted={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Highlighted
      </div>
      <TabItemRow
        tabId={3}
        title="TypeScript Documentation"
        icon={Icon({ color: '#3b82f6' })}
        isActive={false}
        isHighlighted={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Selected
      </div>
      <TabItemRow
        tabId={4}
        title="Tailwind CSS - Rapidly build modern websites"
        icon={Icon({ color: '#06b6d4' })}
        isActive={false}
        isHighlighted={false}
        selected={true}
        isMultiSelectMode={true}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Pinned
      </div>
      <TabItemRow
        tabId={5}
        title="Gmail"
        icon={Icon({ color: '#ea4335' })}
        isActive={false}
        isPinned={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Playing Audio
      </div>
      <TabItemRow
        tabId={6}
        title="YouTube"
        icon={Icon({ color: '#ff0000' })}
        isActive={false}
        isAudible={true}
        isMuted={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">Muted</div>
      <TabItemRow
        tabId={7}
        title="Spotify"
        icon={Icon({ color: '#1db954' })}
        isActive={false}
        isAudible={false}
        isMuted={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Discarded (Unloaded)
      </div>
      <TabItemRow
        tabId={8}
        title="Stack Overflow - Where Developers Learn"
        icon={Icon({ color: '#f48024' })}
        isActive={false}
        isDiscarded={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />
    </div>
  ),
}

// Combined states
export const CombinedStates: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <div className="mb-1 text-xs font-semibold text-gray-400">
        Active + Pinned
      </div>
      <TabItemRow
        tabId={1}
        title="Gmail - Inbox"
        icon={Icon({ color: '#ea4335' })}
        isActive={true}
        isPinned={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Active + Playing Audio
      </div>
      <TabItemRow
        tabId={2}
        title="YouTube Music"
        icon={Icon({ color: '#ff0000' })}
        isActive={true}
        isAudible={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Selected + Pinned
      </div>
      <TabItemRow
        tabId={3}
        title="Google Calendar"
        icon={Icon({ color: '#4285f4' })}
        isActive={false}
        isPinned={true}
        selected={true}
        isMultiSelectMode={true}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Pinned + Muted + Playing
      </div>
      <TabItemRow
        tabId={4}
        title="Slack"
        icon={Icon({ color: '#611f69' })}
        isActive={false}
        isPinned={true}
        isAudible={true}
        isMuted={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Discarded + Pinned
      </div>
      <TabItemRow
        tabId={5}
        title="Twitter"
        icon={Icon({ color: '#1da1f2' })}
        isActive={false}
        isPinned={true}
        isDiscarded={true}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />
    </div>
  ),
}

const states = [
  { isActive: false, selected: false, label: 'Default' },
  { isActive: true, selected: false, label: 'Active' },
  { isActive: false, selected: true, label: 'Selected' },
  { isActive: true, selected: true, label: 'Active + Selected' },
]

// Auto-cycling states demo
const StateCycleComponent = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % states.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const currentState = states[index]

  if (!currentState) return <></>

  return (
    <div className="w-96">
      <div className="mb-2 text-xs font-semibold text-gray-400">
        State: {currentState.label}
      </div>
      <TabItemRow
        tabId={1}
        title="State Cycling Tab"
        icon={Icon({ color: '#3b82f6' })}
        isActive={currentState.isActive}
        selected={currentState.selected}
        isMultiSelectMode={currentState.selected}
        onActivate={() => {}}
      />
    </div>
  )
}

export const StateCycle: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <StateCycleComponent />,
}

// Audio state transitions
const AudioTransitionComponent = () => {
  const [audioState, setAudioState] = useState<
    'silent' | 'playing' | 'playing-muted'
  >('silent')

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioState((s) => {
        if (s === 'silent') return 'playing'
        if (s === 'playing') return 'playing-muted'
        return 'silent'
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-96">
      <div className="mb-2 text-xs font-semibold text-gray-400">
        Audio State:{' '}
        {audioState === 'silent'
          ? 'Silent'
          : audioState === 'playing'
            ? 'Playing'
            : 'Playing (Muted)'}
      </div>
      <TabItemRow
        tabId={1}
        title="YouTube - Music Video"
        icon={Icon({ color: '#ff0000' })}
        isActive={true}
        isAudible={audioState !== 'silent'}
        isMuted={audioState === 'playing-muted'}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />
    </div>
  )
}

export const AudioTransitions: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <AudioTransitionComponent />,
}

// Multi-select mode comparison
export const MultiSelectMode: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <div>
        <div className="mb-2 text-xs font-semibold text-gray-400">
          Default Mode (Focus on Selected)
        </div>
        <div className="flex flex-col gap-2">
          <TabItemRow
            tabId={1}
            title="Tab 1 - Not Selected"
            icon={Icon({ color: '#3b82f6' })}
            isActive={false}
            selected={false}
            isMultiSelectMode={false}
            onActivate={() => {}}
          />
          <TabItemRow
            tabId={2}
            title="Tab 2 - Selected (Subtle Ring)"
            icon={Icon({ color: '#10b981' })}
            isActive={false}
            selected={true}
            isMultiSelectMode={false}
            onActivate={() => {}}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold text-gray-400">
          Multi-Select Mode (Prominent Focus)
        </div>
        <div className="flex flex-col gap-2">
          <TabItemRow
            tabId={3}
            title="Tab 3 - Not Selected"
            icon={Icon({ color: '#06b6d4' })}
            isActive={false}
            selected={false}
            isMultiSelectMode={true}
            onActivate={() => {}}
          />
          <TabItemRow
            tabId={4}
            title="Tab 4 - Selected (Prominent Ring)"
            icon={Icon({ color: '#3b82f6' })}
            isActive={false}
            selected={true}
            isMultiSelectMode={true}
            onActivate={() => {}}
          />
        </div>
      </div>
    </div>
  ),
}

// Title length variations
export const TitleLengths: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <div className="mb-1 text-xs font-semibold text-gray-400">
        Short Title
      </div>
      <TabItemRow
        tabId={1}
        title="Gmail"
        icon={Icon({ color: '#ea4335' })}
        isActive={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Medium Title
      </div>
      <TabItemRow
        tabId={2}
        title="GitHub - microsoft/vscode: Visual Studio Code"
        icon={Icon({ color: '#3b82f6' })}
        isActive={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Long Title (Truncated)
      </div>
      <TabItemRow
        tabId={3}
        title="How to Build a Production-Ready React Application with TypeScript, Tailwind CSS, and Modern Best Practices - Complete Guide 2024"
        icon={Icon({ color: '#ef4444' })}
        isActive={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        No Title
      </div>
      <TabItemRow
        tabId={4}
        icon={Icon({ color: '#9ca3af' })}
        isActive={false}
        selected={false}
        isMultiSelectMode={false}
        onActivate={() => {}}
      />
    </div>
  ),
}

// Tab list simulation
const TabListComponent = () => {
  const [activeId, setActiveId] = useState(2)
  const [selectedIds, setSelectedIds] = useState(new Set<number>())

  const tabs = [
    {
      id: 1,
      icon: Icon({ color: '#3b82f6' }),
      title: 'Gmail',
      url: 'https://mail.google.com',
      pinned: true,
    },
    {
      id: 2,
      icon: Icon({ color: '#ef4444' }),
      title: 'GitHub - microsoft/vscode',
      url: 'https://github.com',
      pinned: false,
    },
    {
      id: 3,
      icon: Icon({ color: '#10b981' }),
      title: 'YouTube - Music Video',
      url: 'https://www.youtube.com',
      pinned: false,
      audible: true,
    },
    {
      id: 4,
      icon: Icon({ color: '#ea4335' }),
      title: 'React Documentation',
      url: 'https://react.dev',
      pinned: false,
    },
    {
      id: 5,
      icon: Icon({ color: '#06b6d4' }),
      title: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      pinned: false,
      discarded: true,
    },
  ]

  const handleSelect = (id: number, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      const newSelected = new Set(selectedIds)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      setSelectedIds(newSelected)
    } else {
      setSelectedIds(new Set())
    }
  }

  return (
    <div className="w-96">
      <div className="mb-2 text-xs text-gray-400">
        Click to activate • Cmd+Click to multi-select
      </div>
      <div className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <TabItemRow
            key={tab.id}
            tabId={tab.id}
            title={tab.title}
            icon={tab.icon}
            isActive={activeId === tab.id}
            isPinned={tab.pinned}
            isAudible={tab.audible}
            isDiscarded={tab.discarded}
            selected={selectedIds.has(tab.id)}
            isMultiSelectMode={selectedIds.size > 0}
            onActivate={() => setActiveId(tab.id)}
            onSelect={(e) => handleSelect(tab.id, e)}
          />
        ))}
      </div>
    </div>
  )
}

export const TabListSimulation: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <TabListComponent />,
}
