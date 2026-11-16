import {
  AppWindow,
  Bookmark,
  History,
  Layers,
  Search,
  Terminal,
  Undo2,
} from 'lucide-react'
import { TabIcon, WindowsIcon } from './ScopeIcons'
import type { OmnibarScope } from '@extension/core'
import type { ComponentType, SVGProps } from 'react'

export const omnibarScopes = {
  all: {
    label: 'All',
    icon: Search,
    placeholder: 'Search tabs, bookmarks, history, and more...',
    empty: 'No results found.',
  },
  'current-window': {
    label: 'Current window',
    icon: AppWindow,
    placeholder: 'Search tabs in the current window…',
    empty: 'No matching tabs in the current window.',
  },
  tabs: {
    label: 'Tabs',
    icon: TabIcon,
    placeholder: 'Search tabs…',
    empty: 'No matching open tabs.',
  },
  bookmarks: {
    label: 'Bookmarks',
    icon: Bookmark,
    placeholder: 'Search bookmarks…',
    empty: 'No matching bookmarks.',
  },
  history: {
    label: 'History',
    icon: History,
    placeholder: 'Search history…',
    empty: 'No matching history.',
  },
  'recently-closed': {
    label: 'Recently closed',
    icon: Undo2,
    placeholder: 'Search recently closed tabs…',
    empty: 'No matching recently closed tabs.',
  },
  windows: {
    label: 'Windows',
    icon: WindowsIcon,
    placeholder: 'Search windows…',
    empty: 'No matching windows.',
  },
  'tab-groups': {
    label: 'Tab groups',
    icon: Layers,
    placeholder: 'Search tab groups…',
    empty: 'No matching tab groups.',
  },
  commands: {
    label: 'Commands',
    icon: Terminal,
    placeholder: 'Search commands…',
    empty: 'No matching commands.',
  },
} satisfies Record<
  OmnibarScope,
  {
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    placeholder: string
    empty: string
  }
>
export type OmnibarScopeEntry = [
  OmnibarScope,
  (typeof omnibarScopes)[OmnibarScope],
]
const orderedScopes: OmnibarScope[] = [
  'all',
  'windows',
  'current-window',
  'tab-groups',
  'tabs',
  'bookmarks',
  'recently-closed',
  'history',
  'commands',
]
export const omnibarScopeEntries: OmnibarScopeEntry[] = orderedScopes.map(
  (scope) => [scope, omnibarScopes[scope]],
)
