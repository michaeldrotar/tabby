import { Omnibar } from '@extension/ui/omnibar/Omnibar'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'
import type { OmnibarResultGenerators } from '@extension/ui/omnibar/useOmnibarFiltering'

const onOpenGroup = fn()

const dummyGroups: OmnibarSearchResult[] = [
  {
    id: 'group:research-current',
    type: 'tab-group',
    title: 'Research',
    groupColor: 'blue',
    groupTabCount: 6,
    groupWindowLabel: 'Current window',
    groupCollapsed: false,
    execute: async () => onOpenGroup('research-current'),
  },
  {
    id: 'group:research-second-window',
    type: 'tab-group',
    title: 'Research',
    groupColor: 'orange',
    groupTabCount: 3,
    groupWindowLabel: 'Window 2',
    groupCollapsed: true,
    execute: async () => onOpenGroup('research-second-window'),
  },
]

const dummyTabs: OmnibarSearchResult[] = [
  {
    id: 'tab:research-notes',
    type: 'tab',
    title: 'Research notes · Notion',
    url: 'https://notion.so/research-notes',
    windowId: 1,
    tabId: 101,
    execute: async () => {},
  },
]

const generators: OmnibarResultGenerators = {
  getGoogleSearchItem: (query) => ({
    id: `search:${query}`,
    type: 'search',
    title: `Search Google for "${query}"`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    execute: async () => {},
  }),
  getUrlNavigationItem: () => [],
  getMatchingCommands: () => [],
  getMatchingTabs: (tabs, queryTerms) =>
    tabs.filter((tab) => {
      const searchableText = `${tab.title} ${tab.url ?? ''}`.toLowerCase()
      return queryTerms.every((term) => searchableText.includes(term))
    }),
  getMatchingTabGroups: (groups, queryTerms) =>
    groups.filter((group) =>
      queryTerms.every((term) => group.title.toLowerCase().includes(term)),
    ),
}

const meta = {
  title: 'Omnibar/Native tab groups',
  component: Omnibar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Search dummy open-group results. Activating either group reports its demo key through a Storybook callback; no live group lookup is wired into the story.',
      },
    },
  },
  args: {
    tabs: dummyTabs,
    groups: dummyGroups,
    onSearch: async () => [],
    generators,
    onDismiss: fn(),
    className:
      'h-[500px] w-[680px] max-w-full rounded-lg border border-border shadow-xl',
  },
  argTypes: {
    tabs: { control: false },
    groups: { control: false },
    onSearch: { control: false },
    generators: { control: false },
    onDismiss: { control: false },
  },
} satisfies Meta<typeof Omnibar>

export default meta
type Story = StoryObj<typeof meta>

export const SearchGroupsAcrossWindows: Story = {}
