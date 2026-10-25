import { Surface } from '@extension/ui/Surface'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import type { SurfaceProps } from '@extension/ui/Surface'
import type {
  TabManagerAction,
  TabManagerIntent,
  TabManagerTabView,
  TabManagerViewModel,
  TabManagerWindowView,
} from '@extension/ui/tab-manager/TabManager'

export type PromoPalette = NonNullable<SurfaceProps['palette']>

export const promoPalette = (
  theme: 'light' | 'dark',
  accent: PromoPalette['accent'] = 'orange',
): PromoPalette => ({
  background: theme === 'light' ? 'stone' : 'neutral',
  foreground: theme === 'light' ? 'neutral' : 'zinc',
  accent,
})

const favicon = (letter: string, color: string) => {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="${color}"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="700" font-family="Arial,sans-serif">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

const faviconColors = ['#4778d1', '#e47a3f', '#a85bc9', '#39a87c', '#d15461']

export const promoTab = (
  id: number,
  title: string,
  domain: string,
  options: Partial<TabManagerTabView> = {},
): TabManagerTabView => {
  const iconColor = faviconColors[id % faviconColors.length]!
  return {
    id,
    title,
    url: `https://${domain}`,
    faviconUrl: favicon(title.trim()[0]?.toUpperCase() ?? 'T', iconColor),
    ageLabel: '2m',
    ...options,
  }
}

export const promoWindow = (
  id: number,
  title: string,
  tabs: TabManagerTabView[],
  options: Partial<Omit<TabManagerWindowView, 'id' | 'title' | 'tabs'>> = {},
): TabManagerWindowView => ({
  id,
  title,
  name: title,
  icon: 'briefcase',
  iconUrl: tabs[0]?.faviconUrl,
  active: false,
  tabs,
  groups: [],
  ...options,
})

export const promoManagerModel = ({
  windows,
  viewedWindowId,
  selectedTabIds = [
    windows
      .find((window) => window.id === viewedWindowId)
      ?.tabs.find((tab) => tab.active)?.id ??
      windows.find((window) => window.id === viewedWindowId)?.tabs[0]?.id,
  ].filter((id): id is number => id !== undefined),
  selectionMode = 'default',
  actions = [],
  contextActions = actions,
  actionMenu = null,
  hoveredItem = null,
}: {
  windows: TabManagerWindowView[]
  viewedWindowId: number
  selectedTabIds?: number[]
  selectionMode?: 'default' | 'multi-select'
  actions?: TabManagerAction[]
  contextActions?: TabManagerAction[]
  actionMenu?: TabManagerViewModel['actionMenu']
  hoveredItem?: TabManagerViewModel['hoveredItem']
}): TabManagerViewModel => ({
  windows,
  actions,
  contextActions,
  actionMenu,
  actionPanel: null,
  renamingGroupId: null,
  renamingGroupTitle: null,
  duplicateTabIds: [],
  viewedWindowId,
  selectedTabIds,
  selectedGroupIds: [],
  selectionMode,
  focusedItem: null,
  hoveredItem,
  notifications: { items: [], expanded: false, paused: false },
  status: 'ready',
  scrollTop: 0,
})

export const PromoTabManager = ({
  model,
  theme = 'light',
  accent = 'orange',
  tokens,
  className,
}: {
  model: TabManagerViewModel
  theme?: 'light' | 'dark'
  accent?: PromoPalette['accent']
  tokens?: SurfaceProps['tokens']
  className?: string
}) => (
  <Surface
    theme={theme}
    palette={promoPalette(theme, accent)}
    tokens={tokens}
    inputMode="static"
    motion="reduced"
    className={className}
  >
    <TabManager
      model={model}
      className="h-full min-h-0"
      onIntent={(_intent: TabManagerIntent) => undefined}
    />
  </Surface>
)
