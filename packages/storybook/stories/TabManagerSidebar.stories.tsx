import { BrowserTabList } from '@extension/ui/BrowserTabList'
import { SearchIcon, SettingsIcon } from '@extension/ui/icons'
import { SidebarAction } from '@extension/ui/tab-manager/ui/SidebarAction'
import { TabManagerShell } from '@extension/ui/tab-manager/ui/TabManagerShell'
import { TabManagerSidebar } from '@extension/ui/tab-manager/ui/TabManagerSidebar'
import { WindowRailItem } from '@extension/ui/tab-manager/ui/WindowRailItem'
import { useState } from 'react'
import type { BrowserTabListItemData } from '@extension/ui/BrowserTabList'
import type { Meta, StoryObj } from '@storybook/react'

const windows = ['Work window', 'Research window', 'Personal window']
const tabs: BrowserTabListItemData[] = [
  'Product brief',
  'Design review',
  'Release notes',
  'Team calendar',
  'Project dashboard',
].map((title, index) => ({
  type: 'tab',
  tab: {
    id: index + 1,
    title,
    url: `https://example.com/tab-${index + 1}`,
    active: index === 0,
  },
}))

const meta = {
  title: 'Tab Manager/Sidebar',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const SidebarDemo = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [viewedWindow, setViewedWindow] = useState(0)
  const [selectedTabIds, setSelectedTabIds] = useState(new Set([1, 2, 3]))

  return (
    <TabManagerShell
      className="h-[520px]"
      sidebar={
        <TabManagerSidebar
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded((expanded) => !expanded)}
          collapseSidebarLabel="Collapse sidebar"
          expandSidebarLabel="Expand sidebar"
          windowCount={windows.length}
          windowList={windows.map((title, index) => (
            <WindowRailItem
              key={title}
              id={index + 1}
              title={title}
              subtitle="5 tabs"
              isActive={index === 0}
              isViewing={index === viewedWindow}
              isExpanded={isExpanded}
              onClick={() => setViewedWindow(index)}
            />
          ))}
          actions={
            <>
              <SidebarAction
                icon={<SearchIcon className="size-5" />}
                label="Search everything"
                isExpanded={isExpanded}
                onClick={() => {}}
              />
              <SidebarAction
                icon={<SettingsIcon className="size-5" />}
                label="Settings"
                isExpanded={isExpanded}
                onClick={() => {}}
              />
            </>
          }
        />
      }
      actionBar={
        <div className="bg-background border-border relative z-50 border-t p-3">
          <span className="text-sm">{selectedTabIds.size} tabs selected</span>
        </div>
      }
    >
      <div className="flex h-14 items-center px-3 text-sm font-medium">
        {windows[viewedWindow]}
      </div>
      <BrowserTabList
        className="px-2"
        items={tabs}
        selectedTabIds={selectedTabIds}
        onTabClick={(tab) => setSelectedTabIds(new Set([Number(tab.id)]))}
      />
    </TabManagerShell>
  )
}

export const ExpandCollapse: Story = {
  render: () => <SidebarDemo />,
}
