import { WindowRailItem } from '@extension/ui/tab-manager/ui/WindowRailItem'
import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

// Simple colored icon components for demos
const Icon = ({ color }: { color: string }) => (
  <div className="h-6 w-6 rounded" style={{ backgroundColor: color }} />
)

const meta = {
  title: 'Tab Manager/WindowRailItem',
  component: WindowRailItem,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    icon: {
      control: false,
      description: 'Icon/image to display (e.g., favicon component)',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WindowRailItem>

export default meta
type Story = StoryObj<typeof meta>

// Basic interactive story
export const Default: Story = {
  args: {
    id: 1,
    title: 'Work Window',
    icon: <Icon color="#3b82f6" />,
    subtitle: '8 tabs',
    isActive: false,
    isViewing: false,
    isExpanded: false,
    selected: false,
    isMultiSelectMode: false,
    onClick: () => console.log('Clicked'),
  },
}

// All visual states side-by-side
export const AllStates: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <div className="mb-1 text-xs font-semibold text-gray-400">Default</div>
      <WindowRailItem
        id={1}
        title="Work Window"
        icon={<Icon color="#3b82f6" />}
        subtitle="8 tabs"
        isActive={false}
        isViewing={false}
        isExpanded={false}
        onClick={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Active
      </div>
      <WindowRailItem
        id={2}
        title="Active Window"
        icon={<Icon color="#10b981" />}
        subtitle="5 tabs"
        isActive={true}
        isViewing={false}
        isExpanded={false}
        onClick={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Viewing
      </div>
      <WindowRailItem
        id={3}
        title="Viewing Window"
        icon={<Icon color="#f59e0b" />}
        subtitle="12 tabs"
        isActive={false}
        isViewing={true}
        isExpanded={false}
        onClick={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Selected
      </div>
      <WindowRailItem
        id={4}
        title="Selected Window"
        icon={<Icon color="#8b5cf6" />}
        subtitle="3 tabs"
        isActive={false}
        isViewing={false}
        isExpanded={false}
        selected={true}
        isMultiSelectMode={true}
        onClick={() => {}}
      />

      <div className="mb-1 mt-2 text-xs font-semibold text-gray-400">
        Active + Viewing
      </div>
      <WindowRailItem
        id={5}
        title="Active Viewing Window"
        icon={<Icon color="#ec4899" />}
        subtitle="6 tabs"
        isActive={true}
        isViewing={true}
        isExpanded={false}
        onClick={() => {}}
      />
    </div>
  ),
}

const states = [
  { isActive: false, isViewing: false, selected: false, label: 'Default' },
  { isActive: true, isViewing: false, selected: false, label: 'Active' },
  { isActive: false, isViewing: true, selected: false, label: 'Viewing' },
  { isActive: false, isViewing: false, selected: true, label: 'Selected' },
  {
    isActive: true,
    isViewing: true,
    selected: false,
    label: 'Active + Viewing',
  },
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
    <div className="w-64">
      <div className="mb-2 text-xs font-semibold text-gray-400">
        State: {currentState.label}
      </div>
      <WindowRailItem
        id={1}
        title="Cycling States Window"
        icon={<Icon color="#3b82f6" />}
        subtitle="8 tabs"
        isActive={currentState.isActive}
        isViewing={currentState.isViewing}
        isExpanded={false}
        selected={currentState.selected}
        isMultiSelectMode={currentState.selected}
        onClick={() => {}}
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

const ExpandCollapseComponent = () => {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setExpanded((e) => !e)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-64">
      <div className="mb-2 text-xs font-semibold text-gray-400">
        {expanded ? 'Expanded' : 'Collapsed'}
      </div>
      <WindowRailItem
        id={1}
        title="Workspace - Browser Tabs"
        icon={<Icon color="#10b981" />}
        subtitle="15 tabs"
        isActive={true}
        isViewing={true}
        isExpanded={expanded}
        onClick={() => {}}
      />
    </div>
  )
}

export const ExpandCollapse: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <ExpandCollapseComponent />,
}

// Many tabs vs few tabs
export const TabCounts: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <div>
        <div className="mb-1 text-xs font-semibold text-gray-400">
          Few Tabs (2)
        </div>
        <WindowRailItem
          id={1}
          title="Personal Window"
          icon={<Icon color="#ef4444" />}
          subtitle="2 tabs"
          isActive={false}
          isViewing={false}
          isExpanded={false}
          onClick={() => {}}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold text-gray-400">
          Normal (12)
        </div>
        <WindowRailItem
          id={2}
          title="Work Window"
          icon={<Icon color="#3b82f6" />}
          subtitle="12 tabs"
          isActive={true}
          isViewing={true}
          isExpanded={false}
          onClick={() => {}}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold text-gray-400">
          Many Tabs (47)
        </div>
        <WindowRailItem
          id={3}
          title="Research Window"
          icon={<Icon color="#f59e0b" />}
          subtitle="47 tabs"
          isActive={false}
          isViewing={false}
          isExpanded={false}
          onClick={() => {}}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold text-gray-400">
          Too Many (250+)
        </div>
        <WindowRailItem
          id={4}
          title="Chaos Window"
          icon={<Icon color="#8b5cf6" />}
          subtitle="278 tabs"
          isActive={false}
          isViewing={false}
          isExpanded={false}
          onClick={() => {}}
        />
      </div>
    </div>
  ),
}
