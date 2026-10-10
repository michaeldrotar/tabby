import type {
  BrowserSnapshot,
  BrowserTab,
  BrowserTabGroup,
  BrowserWindow,
} from '@extension/core'

export interface FixtureWindow extends BrowserWindow {
  tabs: BrowserTab[]
  groups: BrowserTabGroup[]
}

export interface FixtureOptions {
  seed?: string | number
  now?: number
}

type ExplicitFields = {
  windowId?: number
  index?: number
  active?: boolean
  focused?: boolean
}
const explicitFields = new WeakMap<object, ExplicitFields>()

/** Each builder owns its identifiers and clock; creating another resets the scene. */
export const createFixtureBuilder = ({
  seed = 'tabby',
  now = 1_700_000_000_000,
}: FixtureOptions = {}) => {
  let randomState = Array.from(String(seed)).reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16_777_619),
    2_166_136_261,
  )
  const random = () => {
    randomState += 0x6d2b79f5
    let value = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
  let nextWindowId = 1
  let nextTabId = 1
  let nextGroupId = 1
  const fieldsFor = (record: object): ExplicitFields =>
    explicitFields.get(record) ?? record
  const remember = <T extends object>(record: T, fields: ExplicitFields): T => {
    explicitFields.set(record, fields)
    return record
  }
  const uniqueIds = (kind: string, records: readonly { id: number }[]) => {
    const ids = new Set<number>()
    records.forEach(({ id }) => {
      if (!Number.isSafeInteger(id) || id < 0)
        throw new Error(`Invalid ${kind} id: ${id}`)
      if (ids.has(id)) throw new Error(`Duplicate ${kind} id: ${id}`)
      ids.add(id)
    })
  }
  const normalizeTabs = (
    tabs: readonly BrowserTab[],
    windowId: number,
  ): BrowserTab[] => {
    if (!tabs.length) throw new Error(`Window ${windowId} requires a tab`)
    const activeTabs = tabs.filter((tab) => tab.active)
    if (activeTabs.length > 1)
      throw new Error(`Window ${windowId} has multiple active tabs`)
    const activeTab =
      activeTabs[0] ?? tabs.find((tab) => fieldsFor(tab).active !== false)
    if (!activeTab)
      throw new Error(`Window ${windowId} explicitly disables every active tab`)
    return tabs.map((tab, index) => {
      const fields = fieldsFor(tab)
      if (fields.windowId !== undefined && fields.windowId !== windowId)
        throw new Error(
          `Tab ${tab.id} belongs to window ${fields.windowId}, not ${windowId}`,
        )
      if (fields.index !== undefined && fields.index !== index)
        throw new Error(
          `Tab ${tab.id} index ${fields.index} conflicts with position ${index}`,
        )
      return remember(
        { ...tab, windowId, index, active: tab.id === activeTab.id },
        fields,
      )
    })
  }
  const generateTab = (overrides: Partial<BrowserTab> = {}): BrowserTab => {
    const id = overrides.id ?? nextTabId
    nextTabId = Math.max(nextTabId, id + 1)
    const title = ['Tabby', 'Design notes', 'Inbox', 'Documentation'][
      Math.floor(random() * 4)
    ]
    return remember(
      {
        id,
        windowId: 1,
        index: 0,
        title: title ?? 'Tabby',
        url: `https://example.com/tab/${id}`,
        active: false,
        pinned: false,
        discarded: false,
        loading: false,
        audible: false,
        muted: false,
        lastAccessed: now - Math.floor(random() * 60) * 60_000,
        ...overrides,
      },
      {
        windowId: overrides.windowId,
        index: overrides.index,
        active: overrides.active,
      },
    )
  }
  const generateGroup = (
    overrides: Partial<BrowserTabGroup> = {},
  ): BrowserTabGroup => {
    const id = overrides.id ?? nextGroupId
    nextGroupId = Math.max(nextGroupId, id + 1)
    return remember(
      {
        id,
        windowId: 1,
        title: `Group ${id}`,
        color: 'blue',
        collapsed: false,
        ...overrides,
      },
      { windowId: overrides.windowId },
    )
  }
  const generateWindow = (
    overrides: Partial<BrowserWindow> & {
      tabs?: readonly BrowserTab[]
      groups?: readonly BrowserTabGroup[]
    } = {},
  ): FixtureWindow => {
    const id = overrides.id ?? nextWindowId
    nextWindowId = Math.max(nextWindowId, id + 1)
    const {
      tabs = [generateTab({ active: true })],
      groups = [],
      ...windowFields
    } = overrides
    uniqueIds('tab', tabs)
    uniqueIds('group', groups)
    return remember(
      {
        id,
        type: 'normal',
        incognito: false,
        focused: false,
        ...windowFields,
        tabs: normalizeTabs(tabs, id),
        groups: groups.map((group) => {
          const fields = fieldsFor(group)
          if (fields.windowId !== undefined && fields.windowId !== id)
            throw new Error(
              `Group ${group.id} belongs to window ${fields.windowId}, not ${id}`,
            )
          return remember({ ...group, windowId: id }, fields)
        }),
      },
      { focused: overrides.focused },
    )
  }
  const generateScene = (
    overrides: {
      windows?: readonly (BrowserWindow | FixtureWindow)[]
      tabs?: readonly BrowserTab[]
      groups?: readonly BrowserTabGroup[]
    } = {},
  ): BrowserSnapshot => {
    const windows = overrides.windows ?? [generateWindow({ focused: true })]
    const nestedTabs = windows.flatMap((window) =>
      'tabs' in window ? window.tabs : [],
    )
    const nestedGroups = windows.flatMap((window) =>
      'groups' in window ? window.groups : [],
    )
    const sourceTabs = overrides.tabs ?? nestedTabs
    const groups = (overrides.groups ?? nestedGroups).map((group) => ({
      ...group,
    }))
    uniqueIds('window', windows)
    uniqueIds('tab', sourceTabs)
    uniqueIds('group', groups)
    const windowIds = new Set(windows.map((window) => window.id))
    sourceTabs.forEach((tab) => {
      if (!windowIds.has(tab.windowId))
        throw new Error(
          `Tab ${tab.id} references unknown window ${tab.windowId}`,
        )
    })
    groups.forEach((group) => {
      if (!windowIds.has(group.windowId))
        throw new Error(
          `Group ${group.id} references unknown window ${group.windowId}`,
        )
    })
    const tabs = windows.flatMap((window) => {
      let windowTabs = sourceTabs.filter((tab) => tab.windowId === window.id)
      if (windowTabs.every((tab) => fieldsFor(tab).index !== undefined))
        windowTabs = [...windowTabs].sort(
          (left, right) => left.index - right.index,
        )
      return normalizeTabs(windowTabs, window.id)
    })
    tabs.forEach((tab) => {
      if (tab.groupId === undefined) return
      const group = groups.find((item) => item.id === tab.groupId)
      if (!group)
        throw new Error(`Tab ${tab.id} references unknown group ${tab.groupId}`)
      if (group.windowId !== tab.windowId)
        throw new Error(
          `Tab ${tab.id} and group ${group.id} belong to different windows`,
        )
    })
    groups.forEach((group) => {
      const members = tabs.filter((tab) => tab.groupId === group.id)
      if (!members.length) throw new Error(`Group ${group.id} requires a tab`)
      if (members.some((tab, index) => tab.index !== members[0]!.index + index))
        throw new Error(`Group ${group.id} tabs must be contiguous`)
    })
    const focusedWindows = windows.filter((window) => window.focused)
    if (focusedWindows.length > 1)
      throw new Error('Scene has multiple focused windows')
    const focusedWindow =
      focusedWindows[0] ??
      windows.find((window) => fieldsFor(window).focused !== false)
    if (windows.length && !focusedWindow)
      throw new Error('Scene explicitly disables every focused window')
    return {
      state: 'loaded',
      revision: 0,
      windows: windows.map((window) => ({
        id: window.id,
        type: window.type,
        incognito: window.incognito,
        focused: window.id === focusedWindow?.id,
      })),
      tabs,
      groups,
    }
  }
  return { generateTab, generateGroup, generateWindow, generateScene }
}
