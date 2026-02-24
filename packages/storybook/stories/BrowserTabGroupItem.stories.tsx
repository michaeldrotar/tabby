import { BrowserTabGroupItem } from '@extension/ui/BrowserTabGroupItem'
import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { TabList, TabListItem } from '@extension/ui/TabList'
import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Decorator, Meta, StoryObj } from '@storybook/react'

const ColoredIcon = ({ color }: { color: string }) => (
  <div className="h-5 w-5 rounded" style={{ backgroundColor: color }} />
)

const singleColumnDecorator: Decorator = (Story) => (
  <div className="flex w-[560px] max-w-full flex-col gap-2 p-4">
    <Story />
  </div>
)

const wideColumnDecorator: Decorator = (Story) => (
  <div className="flex w-[720px] max-w-full flex-col gap-6 p-4">
    <Story />
  </div>
)

const GROUP_COLOR_OPTIONS = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
] as const

const now = Date.now()

const groupChildren = (
  <TabList className="gap-0.5 pl-2">
    <TabListItem>
      <BrowserTabItem
        tabId={101}
        title="GitHub - issues"
        url="https://github.com/issues"
        favicon={<ColoredIcon color="#24292e" />}
        lastAccessed={now - 2 * 60 * 1000}
        onClose={() => {}}
      />
    </TabListItem>
    <TabListItem>
      <BrowserTabItem
        tabId={102}
        title="Docs - architecture notes"
        url="https://example.com/docs/architecture"
        favicon={<ColoredIcon color="#2563eb" />}
        lastAccessed={now - 15 * 60 * 1000}
      />
    </TabListItem>
  </TabList>
)

const meta = {
  title: 'Tab Manager/BrowserTabGroupItem',
  component: BrowserTabGroupItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A presentational tab-group component for rendering group header UI and nested content. It supports collapse, rename, keyboard shortcuts, and composable children such as TabList, TabListItem, and BrowserTabItem.',
      },
    },
  },
  decorators: [singleColumnDecorator],
  args: {
    groupId: 1,
    title: 'Engineering Workstream',
    color: 'blue',
    collapsed: false,
    selected: false,
    active: false,
    isRenaming: false,
    isMultiSelectMode: false,
    onSelect: fn(),
    onToggleCollapse: fn(),
    onRenameComplete: fn(),
    onRenameCancel: fn(),
    onClose: fn(),
    children: groupChildren,
  },
  argTypes: {
    color: {
      control: 'select',
      options: GROUP_COLOR_OPTIONS,
    },
    children: { control: false },
    onSelect: { control: false, table: { disable: true } },
    onToggleCollapse: { control: false, table: { disable: true } },
    onRenameComplete: { control: false, table: { disable: true } },
    onRenameCancel: { control: false, table: { disable: true } },
    onClose: { control: false, table: { disable: true } },
  },
} satisfies Meta<typeof BrowserTabGroupItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

const states = [
  {
    label: 'Expanded',
    props: {
      collapsed: false,
      selected: false,
      active: false,
      isRenaming: false,
    },
  },
  {
    label: 'Collapsed',
    props: {
      collapsed: true,
      selected: false,
      active: false,
      isRenaming: false,
    },
  },
  {
    label: 'Selected + Active',
    props: {
      collapsed: false,
      selected: true,
      active: true,
      isRenaming: false,
    },
  },
  {
    label: 'Renaming',
    props: {
      collapsed: false,
      selected: true,
      active: false,
      isRenaming: true,
    },
  },
]

export const AllStates: Story = {
  decorators: [wideColumnDecorator],
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full flex-col gap-6">
      {states.map((state, index) => (
        <div key={state.label} className="flex w-full flex-col gap-2">
          <h3 className="text-muted text-xs font-semibold uppercase">
            {state.label}
          </h3>
          <BrowserTabGroupItem
            groupId={index + 1}
            title="Engineering Workstream"
            color="blue"
            isMultiSelectMode={state.props.selected}
            onSelect={() => {}}
            onToggleCollapse={() => {}}
            onRenameComplete={() => {}}
            onRenameCancel={() => {}}
            onClose={() => {}}
            {...state.props}
          >
            {groupChildren}
          </BrowserTabGroupItem>
        </div>
      ))}
    </div>
  ),
}

export const AllColors: Story = {
  decorators: [wideColumnDecorator],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Shows all supported tab-group colors in a realistic flat grouped-tab layout.',
      },
    },
  },
  render: () => (
    <div className="flex w-full flex-col gap-4">
      {GROUP_COLOR_OPTIONS.map((groupColor, index) => (
        <div key={groupColor} className="flex w-full flex-col gap-2">
          <h3 className="text-muted text-xs font-semibold uppercase">
            {groupColor}
          </h3>
          <BrowserTabGroupItem
            groupId={400 + index}
            title="Engineering Workstream"
            color={groupColor}
            selected={index % 3 === 0}
            active={index % 4 === 0}
            onSelect={() => {}}
            onToggleCollapse={() => {}}
            onRenameComplete={() => {}}
            onRenameCancel={() => {}}
            onClose={() => {}}
          >
            <TabList className="gap-0.5 pl-2">
              <TabListItem>
                <BrowserTabItem
                  tabId={500 + index * 2}
                  title="GitHub - pull requests"
                  url="https://github.com/pulls"
                  favicon={<ColoredIcon color="#24292e" />}
                  onClose={() => {}}
                />
              </TabListItem>
              <TabListItem>
                <BrowserTabItem
                  tabId={501 + index * 2}
                  title="Linear - Sprint board"
                  url="https://linear.app/sprint"
                  favicon={<ColoredIcon color="#5e6ad2" />}
                />
              </TabListItem>
            </TabList>
          </BrowserTabGroupItem>
        </div>
      ))}
    </div>
  ),
}

const InteractiveDemo = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [title, setTitle] = useState('Design Team')
  const [renaming, setRenaming] = useState(false)
  const [closedCount, setClosedCount] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted text-xs">
        Click row to select, click chevron to toggle collapse, use Rename to
        enter edit mode, and press Enter/Escape to commit/cancel.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRenaming((v) => !v)}
          className={`
            bg-accent/10 rounded px-2 py-1 text-xs
            hover:bg-accent/20
          `}
        >
          {renaming ? 'Stop Rename' : 'Rename'}
        </button>
      </div>
      <BrowserTabGroupItem
        groupId={77}
        title={title}
        color="cyan"
        collapsed={collapsed}
        selected
        isRenaming={renaming}
        onSelect={() => {}}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onRenameComplete={(next) => {
          setTitle(next || 'Untitled Group')
          setRenaming(false)
        }}
        onRenameCancel={() => setRenaming(false)}
        onClose={() => setClosedCount((v) => v + 1)}
      >
        <TabList className="gap-0.5 pl-2">
          <TabListItem>
            <BrowserTabItem
              tabId={301}
              title="Figma - Design system board"
              url="https://figma.com/file/abc"
              favicon={<ColoredIcon color="#a855f7" />}
            />
          </TabListItem>
          <TabListItem>
            <BrowserTabItem
              tabId={302}
              title="Notion - Team task tracker"
              url="https://notion.so/tasks"
              favicon={<ColoredIcon color="#111827" />}
            />
          </TabListItem>
        </TabList>
      </BrowserTabGroupItem>
      <div className="text-muted text-xs">
        Group close callbacks: {closedCount}
      </div>
    </div>
  )
}

export const Interactive: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <InteractiveDemo />,
}
