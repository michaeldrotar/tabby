import {
  bookmarkLabel,
  bookmarkStructurePlan,
  bookmarkWindowContents,
  canAddBookmarks,
  canEditBookmark,
  directBookmarkPlan,
  directBookmarkSelection,
  flattenBookmarks,
  restoreBookmarkPlan,
} from '@extension/core/bookmarks'
import { isNavigableUrl } from '@extension/core/navigation'
import { createChromeOmnibarNavigator } from './createChromeOmnibarNavigator.js'
import type {
  BookmarkNode,
  BookmarkResource,
  BookmarkSnapshot,
  BookmarkWindowPlan,
  BookmarkWriteNode,
} from '@extension/core/bookmarks'

const preferenceKey = 'tabby-bookmark-sidebar'
const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const createChromeBookmarkResource = (
  api: typeof chrome,
): BookmarkResource => {
  let snapshot: BookmarkSnapshot = {
    status: 'loading',
    roots: [],
    folderId: '0',
  }
  let running = false
  let generation = 0
  let revision = 0
  let starting: Promise<void> | undefined
  const listeners = new Set<() => void>()
  const publish = (next: BookmarkSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  const refresh = async () => {
    const operation = generation
    const request = ++revision
    try {
      const roots = await api.bookmarks.getTree()
      if (!running || operation !== generation || request !== revision) return
      const folderId = flattenBookmarks(roots).some(
        (node) => node.id === snapshot.folderId && node.url === undefined,
      )
        ? snapshot.folderId
        : '0'
      publish({ roots, folderId, status: 'ready' })
    } catch (error) {
      if (running && operation === generation && request === revision)
        publish({ ...snapshot, status: 'error', error: message(error) })
    }
  }
  const changed = () => {
    void refresh()
  }
  const events = [
    api.bookmarks.onCreated,
    api.bookmarks.onChanged,
    api.bookmarks.onMoved,
    api.bookmarks.onRemoved,
    api.bookmarks.onChildrenReordered,
    api.bookmarks.onImportEnded,
  ]
  const treeNode = async (id: string) => {
    const nodes = flattenBookmarks(await api.bookmarks.getTree())
    const node = nodes.find((node) => node.id === id)
    if (!node) throw new Error('This bookmark or folder no longer exists.')
    return { node, nodes }
  }
  const requireEditable = (node: BookmarkNode) => {
    if (!canEditBookmark(node))
      throw new Error('Chrome manages this item. It cannot be changed.')
  }
  const requireFolder = (node: BookmarkNode) => {
    if (!canAddBookmarks(node))
      throw new Error('Choose a writable bookmark folder.')
  }
  const requireTitle = (title: string) => {
    if (!title.trim()) throw new Error('Enter a name.')
  }
  const requireUrl = (url?: string) => {
    if (url !== undefined && !isNavigableUrl(url))
      throw new Error('This address cannot be saved or opened by Tabby.')
  }
  const mutate = async (action: () => Promise<unknown>) => {
    try {
      await action()
    } finally {
      await refresh()
    }
  }
  const openPlans = async (plans: BookmarkWindowPlan[], windowId?: number) => {
    let opened = 0,
      skipped = 0,
      createdWindows = 0
    for (const plan of plans) {
      let destination = windowId
      const grouped = new Map<string, number[]>()
      for (const tab of plan.tabs) {
        try {
          let created: chrome.tabs.Tab | undefined
          if (destination === undefined) {
            const window = await api.windows.create({
              url: tab.url,
              focused: true,
            })
            destination = window?.id
            created = window?.tabs?.[0]
            if (destination === undefined)
              throw new Error('Chrome did not create a window.')
            if (!created)
              [created] = await api.tabs.query({ windowId: destination })
            createdWindows++
          } else
            created = await api.tabs.create({
              windowId: destination,
              url: tab.url,
              active: false,
            })
          if (created?.id === undefined)
            throw new Error('Chrome did not create a tab.')
          opened++
          if (tab.group)
            grouped.set(tab.group, [
              ...(grouped.get(tab.group) ?? []),
              created.id,
            ])
        } catch {
          skipped++
        }
      }
      for (const group of plan.groups) {
        const tabIds = grouped.get(group.id)
        if (!tabIds?.length) continue
        try {
          const id = await api.tabs.group({
            tabIds: tabIds as [number, ...number[]],
            createProperties: { windowId: destination! },
          })
          await api.tabGroups.update(id, {
            title: group.title,
            color: group.color,
          })
        } catch (error) {
          throw new Error(
            `Opened ${opened} tabs, but Chrome could not restore a group: ${message(error)}`,
          )
        }
      }
    }
    return { opened, skipped, createdWindows }
  }
  const openSummary = async (
    plans: BookmarkWindowPlan[],
    unsupported: number,
    windowId?: number,
  ) => {
    if (!plans.some((plan) => plan.tabs.length))
      throw new Error(
        `No bookmarks that Tabby can open.${unsupported ? ` ${unsupported} unsupported addresses skipped.` : ''}`,
      )
    const result = await openPlans(plans, windowId)
    return `Opened ${result.opened} tabs${result.createdWindows ? ` in ${result.createdWindows} new ${result.createdWindows === 1 ? 'window' : 'windows'}` : ''}.${result.skipped + unsupported ? ` Skipped ${result.skipped + unsupported} addresses Chrome could not open.` : ''}`
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    start: () => {
      if (starting) return starting
      running = true
      const operation = ++generation
      events.forEach((event) => event.addListener(changed))
      starting = (async () => {
        try {
          const saved = (await api.storage.local.get(preferenceKey))[
            preferenceKey
          ]
          if (!running || operation !== generation) return
          if (
            saved &&
            typeof saved === 'object' &&
            'folderId' in saved &&
            typeof saved.folderId === 'string'
          )
            snapshot = { ...snapshot, folderId: saved.folderId }
          await refresh()
        } catch (error) {
          if (running && operation === generation)
            publish({ ...snapshot, status: 'error', error: message(error) })
        }
      })()
      return starting
    },
    dispose: () => {
      running = false
      generation++
      starting = undefined
      events.forEach((event) => event.removeListener(changed))
    },
    selectFolder: async (folderId) => {
      const { node } = await treeNode(folderId)
      if (node.url !== undefined) throw new Error('Choose a folder.')
      publish({ ...snapshot, folderId })
      await api.storage.local.set({ [preferenceKey]: { folderId } })
    },
    create: async (parentId, title, url) => {
      requireTitle(title)
      requireUrl(url)
      requireFolder((await treeNode(parentId)).node)
      await mutate(() =>
        api.bookmarks.create({
          parentId,
          title,
          ...(url === undefined ? {} : { url }),
        }),
      )
    },
    update: async (id, title, url) => {
      requireTitle(title)
      requireUrl(url)
      const { node } = await treeNode(id)
      requireEditable(node)
      if ((node.url === undefined) !== (url === undefined))
        throw new Error('Bookmarks and folders cannot change type.')
      await mutate(() =>
        api.bookmarks.update(id, {
          title,
          ...(url === undefined ? {} : { url }),
        }),
      )
    },
    move: async (id, parentId, index) => {
      const { node, nodes } = await treeNode(id)
      requireEditable(node)
      const parent = nodes.find((node) => node.id === parentId)
      if (!parent) throw new Error('The destination folder no longer exists.')
      requireFolder(parent)
      if (flattenBookmarks([node]).some((child) => child.id === parentId))
        throw new Error('A folder cannot be moved into itself or its children.')
      if (index !== undefined && (!Number.isInteger(index) || index < 0))
        throw new Error('Choose a valid position.')
      const oldIndex =
        parent.children?.findIndex((child) => child.id === id) ?? -1
      const insertionIndex =
        index !== undefined &&
        node.parentId === parentId &&
        oldIndex >= 0 &&
        index > oldIndex
          ? index + 1
          : index
      await mutate(() =>
        api.bookmarks.move(id, {
          parentId,
          ...(insertionIndex === undefined ? {} : { index: insertionIndex }),
        }),
      )
    },
    remove: async (id) => {
      const { node } = await treeNode(id)
      requireEditable(node)
      if (flattenBookmarks([node]).some((child) => child.unmodifiable))
        throw new Error(
          'This folder contains managed bookmarks and cannot be deleted.',
        )
      await mutate(() =>
        node.url === undefined
          ? api.bookmarks.removeTree(id)
          : api.bookmarks.remove(id),
      )
    },
    open: async (id, windowId, modifier) => {
      const { node } = await treeNode(id)
      if (!node.url) throw new Error('Choose a bookmark.')
      await createChromeOmnibarNavigator(api, windowId)(
        { kind: 'url', url: node.url },
        modifier,
        0,
      )
      return `Opened ${bookmarkLabel(node) || node.url}.`
    },
    openFolder: async (id, destination, windowId) => {
      const { node } = await treeNode(id)
      if (node.url !== undefined) throw new Error('Choose a folder.')
      let plans =
        destination === 'structure'
          ? bookmarkStructurePlan(node)
          : [
              destination === 'restore'
                ? restoreBookmarkPlan(node)
                : directBookmarkPlan(node),
            ]
      const candidates =
        destination === 'structure' || destination === 'restore'
          ? flattenBookmarks(node.children ?? [])
          : (node.children ?? [])
      const unsupported = candidates.filter(
        (node) => node.url !== undefined && !isNavigableUrl(node.url),
      ).length
      if (destination === 'group')
        plans = plans.map((plan) => ({
          tabs: plan.tabs.map((tab) => ({ ...tab, group: id })),
          groups: [{ id, title: bookmarkLabel(node), color: 'grey' }],
        }))
      return openSummary(
        plans,
        unsupported,
        destination === 'tabs' || destination === 'group'
          ? windowId
          : undefined,
      )
    },
    openItems: async (ids, destination, windowId) => {
      const nodes = flattenBookmarks(await api.bookmarks.getTree())
      const byId = new Map(nodes.map((node) => [node.id, node]))
      const selected = ids.map((id) => {
        const node = byId.get(id)
        if (!node) throw new Error('A selected bookmark no longer exists.')
        return node
      })
      const candidates = directBookmarkSelection(selected)
      const plan = directBookmarkPlan({
        id: 'selection',
        title: '',
        children: candidates,
      })
      if (destination === 'group') {
        plan.groups = [
          {
            id: 'selection',
            title:
              selected.length === 1 ? bookmarkLabel(selected[0]!) : 'Bookmarks',
            color: 'grey',
          },
        ]
        plan.tabs = plan.tabs.map((tab) => ({ ...tab, group: 'selection' }))
      }
      return openSummary(
        [plan],
        candidates.filter((node) => !isNavigableUrl(node.url!)).length,
        destination === 'window' ? undefined : windowId,
      )
    },
    saveWindow: async (windowId, parentId, newFolderTitle) => {
      requireFolder((await treeNode(parentId)).node)
      if (newFolderTitle !== undefined) requireTitle(newFolderTitle)
      const [tabs, groups] = await Promise.all([
        api.tabs.query({ windowId }),
        api.tabGroups.query({ windowId }),
      ])
      const contents = bookmarkWindowContents(
        tabs
          .filter(
            (tab): tab is chrome.tabs.Tab & { id: number } =>
              tab.id !== undefined,
          )
          .map((tab) => ({
            ...tab,
            title: tab.title ?? '',
            url: tab.pendingUrl ?? tab.url,
          })),
        groups,
      )
      if (!contents.children.length)
        throw new Error('This window has no tabs that Tabby can bookmark.')
      const createdIds: string[] = []
      const write = async (parentId: string, nodes: BookmarkWriteNode[]) => {
        for (const node of nodes) {
          const created = await api.bookmarks.create({
            parentId,
            title: node.title,
            ...(node.url === undefined ? {} : { url: node.url }),
          })
          createdIds.push(created.id)
          if (node.children) await write(created.id, node.children)
        }
      }
      try {
        let destination = parentId
        if (newFolderTitle !== undefined) {
          const folder = await api.bookmarks.create({
            parentId,
            title: newFolderTitle,
          })
          destination = folder.id
          createdIds.push(folder.id)
        }
        await write(destination, contents.children)
        await refresh()
        await api.storage.local.set({
          [preferenceKey]: { folderId: destination },
        })
        publish({ ...snapshot, folderId: destination })
      } catch (error) {
        let rollbackFailed = false
        for (const id of createdIds.reverse()) {
          try {
            await api.bookmarks.remove(id)
          } catch {
            rollbackFailed = true
          }
        }
        await refresh()
        throw new Error(
          `Could not bookmark this window: ${message(error)}${rollbackFailed ? ' Some created entries remain; check the destination folder.' : ' No new entries were kept.'}`,
        )
      }
      return `Bookmarked ${tabs.length - contents.skipped} tabs.${contents.skipped ? ` Skipped ${contents.skipped} unsupported or unavailable addresses.` : ''}`
    },
  }
}
