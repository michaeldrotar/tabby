import { BROWSER_TAB_GROUP_COLORS } from './browser.js'
import { isNavigableUrl } from './navigation.js'
import type {
  BrowserTab,
  BrowserTabGroup,
  BrowserTabGroupColor,
} from './browser.js'
import type { OmnibarModifier } from './omnibar.js'

export type BookmarkNode = {
  id: string
  parentId?: string
  title: string
  url?: string
  children?: BookmarkNode[]
  unmodifiable?: string
  folderType?: string
}
export type BookmarkSnapshot = {
  status: 'loading' | 'ready' | 'error'
  roots: BookmarkNode[]
  folderId: string
  error?: string
}
export type BookmarkDestination =
  | 'tabs'
  | 'window'
  | 'group'
  | 'structure'
  | 'restore'
export type BookmarkResource = {
  getSnapshot: () => BookmarkSnapshot
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  selectFolder: (id: string) => Promise<void>
  create: (parentId: string, title: string, url?: string) => Promise<void>
  update: (id: string, title: string, url?: string) => Promise<void>
  move: (id: string, parentId: string, index?: number) => Promise<void>
  remove: (id: string) => Promise<void>
  open: (
    id: string,
    windowId: number,
    modifier?: OmnibarModifier,
  ) => Promise<string>
  openFolder: (
    id: string,
    destination: BookmarkDestination,
    windowId: number,
  ) => Promise<string>
  openItems: (
    ids: readonly string[],
    destination: 'tabs' | 'window' | 'group',
    windowId: number,
  ) => Promise<string>
  saveWindow: (
    windowId: number,
    parentId: string,
    newFolderTitle?: string,
  ) => Promise<string>
}

export const flattenBookmarks = (
  nodes: readonly BookmarkNode[],
): BookmarkNode[] =>
  nodes.flatMap((node) => [node, ...flattenBookmarks(node.children ?? [])])

export const bookmarkLabel = (node: BookmarkNode) =>
  decodeBookmarkGroup(node.title)?.title ?? node.title

export const canEditBookmark = (node: BookmarkNode) =>
  !!node.parentId &&
  node.parentId !== '0' &&
  !node.unmodifiable &&
  !node.folderType
export const canAddBookmarks = (node: BookmarkNode) =>
  node.url === undefined && node.id !== '0' && !node.unmodifiable

export const bookmarkSelectionRoots = (
  nodes: readonly BookmarkNode[],
  ids: readonly string[],
): BookmarkNode[] => {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const selected = new Set(ids)
  return ids.flatMap((id) => {
    const node = byId.get(id)
    if (!node) return []
    let parent = node.parentId ? byId.get(node.parentId) : undefined
    while (parent) {
      if (selected.has(parent.id)) return []
      parent = parent.parentId ? byId.get(parent.parentId) : undefined
    }
    return [node]
  })
}

export const directBookmarkSelection = (
  nodes: readonly BookmarkNode[],
): BookmarkNode[] => {
  const seen = new Set<string>()
  return nodes
    .flatMap((node) =>
      node.url === undefined ? (node.children ?? []) : [node],
    )
    .filter((node) => {
      if (node.url === undefined || seen.has(node.id)) return false
      seen.add(node.id)
      return true
    })
}

export const encodeBookmarkGroup = (group: {
  id: string
  title: string
  color: BrowserTabGroupColor
}) =>
  `${group.title || 'Untitled group'} [Tabby group v1:${encodeURIComponent(JSON.stringify([group.id, group.title, group.color]))}]`

export const decodeBookmarkGroup = (
  title: string,
): { id: string; title: string; color: BrowserTabGroupColor } | undefined => {
  const match = title.match(/^([\s\S]*) \[Tabby group v1:([^\]]+)\]$/)
  if (!match) return undefined
  const [, visibleTitle, encoded] = match
  try {
    const value: unknown = JSON.parse(decodeURIComponent(encoded!))
    if (
      Array.isArray(value) &&
      value.length === 3 &&
      typeof value[0] === 'string' &&
      typeof value[1] === 'string' &&
      BROWSER_TAB_GROUP_COLORS.includes(value[2])
    )
      return {
        id: value[0],
        title:
          visibleTitle === (value[1] || 'Untitled group')
            ? value[1]
            : visibleTitle!,
        color: value[2],
      }
  } catch {
    /* An edited folder title is an ordinary folder. */
  }
  return undefined
}

export type BookmarkWindowPlan = {
  tabs: { url: string; group?: string }[]
  groups: { id: string; title: string; color: BrowserTabGroupColor }[]
}
const usable = (node: BookmarkNode) =>
  node.url !== undefined && isNavigableUrl(node.url)
export const directBookmarkPlan = (
  folder: BookmarkNode,
): BookmarkWindowPlan => ({
  tabs: (folder.children ?? [])
    .filter(usable)
    .map((node) => ({ url: node.url! })),
  groups: [],
})

/** Each child folder is a group; deeper descendants keep their nearest group's boundary. */
export const restoreBookmarkPlan = (
  folder: BookmarkNode,
): BookmarkWindowPlan => {
  const plan: BookmarkWindowPlan = { tabs: [], groups: [] }
  for (const child of folder.children ?? []) {
    if (child.url !== undefined) {
      if (usable(child)) plan.tabs.push({ url: child.url })
      continue
    }
    const tabs = flattenBookmarks(child.children ?? []).filter(usable)
    if (!tabs.length) continue
    const metadata = decodeBookmarkGroup(child.title)
    plan.groups.push({
      id: child.id,
      title: metadata?.title ?? child.title,
      color: metadata?.color ?? 'grey',
    })
    plan.tabs.push(...tabs.map((tab) => ({ url: tab.url!, group: child.id })))
  }
  return plan
}

export const bookmarkStructurePlan = (
  folder: BookmarkNode,
): BookmarkWindowPlan[] =>
  [
    directBookmarkPlan(folder),
    ...(folder.children ?? [])
      .filter((node) => node.url === undefined)
      .map(restoreBookmarkPlan),
  ].filter((plan) => plan.tabs.length > 0)

export type BookmarkWriteNode = {
  title: string
  url?: string
  children?: BookmarkWriteNode[]
}
export const bookmarkWindowContents = (
  tabs: readonly BrowserTab[],
  groups: readonly BrowserTabGroup[],
): { children: BookmarkWriteNode[]; skipped: number } => {
  const children: BookmarkWriteNode[] = []
  const folders = new Map<number, BookmarkWriteNode>()
  let skipped = 0
  for (const tab of [...tabs].sort((a, b) => a.index - b.index)) {
    if (!tab.url || !isNavigableUrl(tab.url)) {
      skipped++
      continue
    }
    const bookmark = { title: tab.title, url: tab.url }
    const group = groups.find((group) => group.id === tab.groupId)
    if (!group) {
      children.push(bookmark)
      continue
    }
    let folder = folders.get(group.id)
    if (!folder) {
      folder = {
        title: encodeBookmarkGroup({
          id: String(group.id),
          title: group.title ?? '',
          color: group.color,
        }),
        children: [],
      }
      folders.set(group.id, folder)
      children.push(folder)
    }
    folder.children!.push(bookmark)
  }
  return { children, skipped }
}
