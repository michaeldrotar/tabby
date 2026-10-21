import { getTabDiscardStatus } from '@extension/core/actions/batchTabActions'
import {
  createCommandOutcome,
  getCommandBlockReason,
  getCommandTargetIds,
  getTabMoveUnits,
  planGroupMove,
  planTabCreation,
  planTabMove,
} from '@extension/core/commands'
import { planTabPlacement } from '@extension/core/tabPlacement'
import { getChromeFaviconUrl } from './favicon.js'
import { WINDOW_IDENTITIES_KEY } from './registerWindowIdentities.js'
import type { WindowIdentityAssignment } from './registerWindowIdentities.js'
import type {
  BrowserBackend,
  BrowserCommand,
  BrowserSnapshot,
  BrowserTab,
  BrowserTabGroup,
  BrowserWindow,
  CommandOutcome,
} from '@extension/core/browser'

export type ChromeBackendApi = Pick<typeof chrome, 'windows' | 'tabs'> & {
  runtime?: Pick<typeof chrome.runtime, 'getURL'> &
    Partial<Pick<typeof chrome.runtime, 'sendMessage'>>
  storage?: typeof chrome.storage
  tabGroups?: typeof chrome.tabGroups
}

const hasId = <T extends { id?: number }>(
  value: T,
): value is T & { id: number } => typeof value.id === 'number' && value.id >= 0

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const normalizeSnapshot = (
  windows: chrome.windows.Window[],
  tabs: chrome.tabs.Tab[],
  groups: chrome.tabGroups.TabGroup[],
  previousTabs: readonly BrowserTab[] = [],
  replacementKeys: ReadonlyMap<number, number> = new Map(),
  runtime?: Pick<typeof chrome.runtime, 'getURL'>,
): Pick<BrowserSnapshot, 'windows' | 'tabs' | 'groups'> => {
  const previousById = new Map(previousTabs.map((tab) => [tab.id, tab]))
  const previousByRenderKey = new Map(
    previousTabs.map((tab) => [tab.renderKey ?? tab.id, tab]),
  )
  const browserWindows: BrowserWindow[] = windows
    .filter(hasId)
    .filter((window) => window.type === 'normal')
    .map(({ id, type, incognito, focused }) => ({
      id,
      type,
      incognito,
      focused,
    }))
    .sort((a, b) => a.id - b.id)
  const windowIds = new Set(browserWindows.map((window) => window.id))
  const browserTabs: BrowserTab[] = tabs
    .filter(hasId)
    .filter((tab) => windowIds.has(tab.windowId))
    .map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      index: tab.index,
      title: tab.title ?? '',
      url: tab.url,
      active: tab.active,
      pinned: tab.pinned,
      discarded: tab.discarded,
      loading: tab.status === 'loading' || !tab.url,
      hasLoaded:
        (tab.status !== 'loading' && Boolean(tab.url)) ||
        (
          previousById.get(tab.id) ??
          previousByRenderKey.get(replacementKeys.get(tab.id) ?? tab.id)
        )?.hasLoaded === true,
      renderKey: replacementKeys.get(tab.id) ?? tab.id,
      audible: tab.audible,
      muted: tab.mutedInfo?.muted,
      faviconUrl:
        runtime && tab.url
          ? getChromeFaviconUrl(runtime, tab.url, 32)
          : tab.favIconUrl,
      lastAccessed: tab.lastAccessed,
      groupId: tab.groupId >= 0 ? tab.groupId : undefined,
    }))
    .sort((a, b) => a.windowId - b.windowId || a.index - b.index)
  const browserGroups: BrowserTabGroup[] = groups
    .filter(hasId)
    .filter((group) => windowIds.has(group.windowId))
    .map(({ id, windowId, title, color, collapsed }) => ({
      id,
      windowId,
      title,
      color,
      collapsed,
    }))
    .sort((a, b) => a.id - b.id)
  return { windows: browserWindows, tabs: browserTabs, groups: browserGroups }
}

export const createChromeBackend = (
  api: ChromeBackendApi,
  options: { delegateClosingWindowMoves?: boolean } = {},
): BrowserBackend => {
  let snapshot: BrowserSnapshot = {
    state: 'loading',
    revision: 0,
    windows: [],
    tabs: [],
    groups: [],
  }
  const replacementKeys = new Map<number, number>()
  const subscribers = new Set<() => void>()
  let generation = 0
  let running = false
  let eventRevision = 0
  let refreshTask: Promise<void> | undefined
  let removeListeners: (() => void)[] = []

  const publish = (next: Omit<BrowserSnapshot, 'revision'>): void => {
    const { revision: _revision, ...previous } = snapshot
    if (JSON.stringify(previous) === JSON.stringify(next)) return
    snapshot = { ...next, revision: snapshot.revision + 1 }
    subscribers.forEach((listener) => listener())
  }

  const refresh = (): Promise<void> => {
    if (!running) return Promise.resolve()
    if (refreshTask) return refreshTask
    const currentGeneration = generation
    const task = (async () => {
      let observedRevision: number
      do {
        observedRevision = eventRevision
        try {
          const [windows, tabs, groups, identities] = await Promise.all([
            api.windows.getAll({ windowTypes: ['normal'] }),
            api.tabs.query({}),
            api.tabGroups?.query({}) ?? Promise.resolve([]),
            api.storage?.session.get(WINDOW_IDENTITIES_KEY) ??
              Promise.resolve({} as Record<string, unknown>),
          ])
          if (!running || generation !== currentGeneration) return
          // An event during a query may make its records stale. Requery before
          // publishing so removed records cannot be resurrected on initial load.
          if (observedRevision !== eventRevision) continue
          const data = normalizeSnapshot(
            windows,
            tabs,
            groups,
            snapshot.tabs,
            replacementKeys,
            api.runtime,
          )
          const assigned = (identities[WINDOW_IDENTITIES_KEY] ?? {}) as Record<
            string,
            WindowIdentityAssignment
          >
          publish({
            state: 'loaded',
            ...data,
            windows: data.windows.map((window) => {
              const identity = assigned[window.id]
              return identity?.provisional
                ? window
                : {
                    ...window,
                    name: identity?.name,
                    icon: identity?.icon,
                    iconColor: identity?.iconColor,
                  }
            }),
          })
        } catch (error) {
          if (!running || generation !== currentGeneration) return
          if (observedRevision !== eventRevision) continue
          publish({
            state: 'error',
            windows: snapshot.windows,
            tabs: snapshot.tabs,
            groups: snapshot.groups,
            error: errorMessage(error),
          })
        }
      } while (observedRevision !== eventRevision)
    })()
    refreshTask = task
    void task.finally(() => {
      if (refreshTask === task) refreshTask = undefined
    })
    return task
  }

  const invalidate = (): Promise<void> => {
    eventRevision += 1
    return refresh()
  }

  const start = (): Promise<void> => {
    if (running) return refresh()
    running = true
    generation += 1
    const currentGeneration = generation
    const onChange = () => {
      if (running && generation === currentGeneration) void invalidate()
    }
    const events: (
      | Pick<chrome.events.Event<() => void>, 'addListener' | 'removeListener'>
      | undefined
    )[] = [
      api.windows.onCreated,
      api.windows.onRemoved,
      api.windows.onFocusChanged,
      api.windows.onBoundsChanged,
      api.tabs.onCreated,
      api.tabs.onRemoved,
      api.tabs.onUpdated,
      api.tabs.onActivated,
      api.tabs.onHighlighted,
      api.tabs.onMoved,
      api.tabs.onAttached,
      api.tabs.onDetached,
      api.tabGroups?.onCreated,
      api.tabGroups?.onRemoved,
      api.tabGroups?.onUpdated,
      api.tabGroups?.onMoved,
    ]
    if (api.storage) {
      const onStorage = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string,
      ) => {
        if (area === 'session' && changes[WINDOW_IDENTITIES_KEY]) onChange()
      }
      api.storage.onChanged.addListener(onStorage)
      removeListeners.push(() =>
        api.storage?.onChanged.removeListener(onStorage),
      )
    }
    const onReplaced = (addedTabId: number, removedTabId: number) => {
      if (!running || generation !== currentGeneration) return
      replacementKeys.set(
        addedTabId,
        replacementKeys.get(removedTabId) ?? removedTabId,
      )
      replacementKeys.delete(removedTabId)
      void invalidate()
    }
    api.tabs.onReplaced.addListener(onReplaced)
    removeListeners.push(() => api.tabs.onReplaced.removeListener(onReplaced))
    events.forEach((event) => {
      if (!event) return
      event.addListener(onChange)
      removeListeners.push(() => event.removeListener(onChange))
    })
    return invalidate()
  }

  const execute = async (command: BrowserCommand): Promise<CommandOutcome> => {
    const commandGeneration = generation
    const requestedIds = getCommandTargetIds(command, snapshot)
    const succeededIds: number[] = []
    const failures: { id: number; message: string }[] = []
    let createdWindowIds: number[] | undefined
    let createdTabIds: number[] | undefined
    let createdGroupIds: number[] | undefined
    const skippedActiveIds: number[] = []
    const skippedAlreadyDiscardedIds: number[] = []
    const requireGroups = () => {
      if (!api.tabGroups)
        throw new Error('Tab groups are unavailable in this browser.')
      return api.tabGroups
    }
    const attempt = async (id: number, operation: () => Promise<unknown>) => {
      try {
        if (!running || generation !== commandGeneration)
          throw new Error('The browser connection was stopped.')
        await operation()
        succeededIds.push(id)
      } catch (error) {
        failures.push({ id, message: errorMessage(error) })
      }
    }

    if (!running) {
      return {
        status: 'failed',
        requestedIds,
        succeededIds,
        failures: (requestedIds.length ? requestedIds : [-1]).map((id) => ({
          id,
          message: 'The browser connection is not running.',
        })),
      }
    }

    const blocked = getCommandBlockReason(command, snapshot)
    if (blocked)
      return createCommandOutcome(
        requestedIds,
        [],
        (requestedIds.length ? requestedIds : [-1]).map((id) => ({
          id,
          message: blocked,
        })),
      )
    if (
      options.delegateClosingWindowMoves &&
      api.runtime?.sendMessage &&
      (command.type === 'move-tabs' ||
        command.type === 'move-group' ||
        command.type === 'place-tabs')
    ) {
      const ids =
        command.type === 'move-group'
          ? snapshot.tabs
              .filter((tab) => tab.groupId === command.groupId)
              .map((tab) => tab.id)
          : command.tabIds
      const destination =
        command.type === 'place-tabs'
          ? command.destination.windowId
          : command.windowId
      const closesSource = snapshot.windows.some((window) => {
        const tabs = snapshot.tabs.filter((tab) => tab.windowId === window.id)
        return (
          window.id !== destination &&
          tabs.length > 0 &&
          tabs.every((tab) => ids.includes(tab.id))
        )
      })
      if (closesSource) {
        const response = await api.runtime.sendMessage({
          type: 'tabby-move-from-closing-window',
          command,
        })
        if (response?.outcome) {
          if (running && generation === commandGeneration) await invalidate()
          return response.outcome as CommandOutcome
        }
      }
    }
    switch (command.type) {
      case 'name-window':
        await attempt(command.windowId, async () => {
          if (!api.runtime?.sendMessage)
            throw new Error('Window naming is unavailable.')
          const response = await api.runtime.sendMessage({
            ...command,
            type: 'tabby-name-window',
          })
          if (!response?.success)
            throw new Error(response?.error ?? 'Could not save window name.')
        })
        break
      case 'create-tab':
        try {
          const plan = planTabCreation(snapshot, command)
          const tab = await api.tabs.create({
            windowId: plan.windowId,
            url: command.url,
            active: true,
            ...(plan.index !== undefined
              ? { index: plan.index, openerTabId: plan.openerTabId }
              : {}),
          })
          if (!hasId(tab))
            throw new Error('Chrome did not return the created tab.')
          createdTabIds = [tab.id]
          if (
            plan.groupId !== undefined &&
            running &&
            generation === commandGeneration
          )
            await api.tabs.group({ tabIds: tab.id, groupId: plan.groupId })
          if (running && generation === commandGeneration)
            await api.windows.update(tab.windowId, { focused: true })
        } catch (error) {
          failures.push({ id: -1, message: errorMessage(error) })
        }
        break
      case 'navigate-tab':
        await attempt(command.tabId, () =>
          api.tabs.update(command.tabId, { url: command.url, active: true }),
        )
        break
      case 'tab-action':
        for (const id of requestedIds) {
          if (command.action === 'discard') {
            const status = getTabDiscardStatus(
              snapshot.tabs.find((tab) => tab.id === id),
            )
            if (status === 'active') {
              skippedActiveIds.push(id)
              continue
            }
            if (status === 'already-discarded') {
              skippedAlreadyDiscardedIds.push(id)
              continue
            }
          }
          await attempt(id, async () => {
            switch (command.action) {
              case 'pin':
              case 'unpin':
                await api.tabs.update(id, { pinned: command.action === 'pin' })
                break
              case 'mute':
              case 'unmute':
                await api.tabs.update(id, { muted: command.action === 'mute' })
                break
              case 'reload':
                await api.tabs.reload(id)
                break
              case 'discard':
                await api.tabs.discard(id)
                break
              case 'ungroup':
                await api.tabs.ungroup(id)
                break
              case 'duplicate': {
                const tab = await api.tabs.duplicate(id)
                if (!tab || !hasId(tab))
                  throw new Error('Chrome did not return the duplicated tab.')
                createdTabIds = [...(createdTabIds ?? []), tab.id]
                break
              }
            }
          })
        }
        break
      case 'place-tabs': {
        const destination = command.destination
        const plan = planTabPlacement(snapshot, command.tabIds, destination)
        let anchor = plan.beforeTabId
        for (const unit of plan.units.toReversed()) {
          const first = unit.tabIds[0]!
          const failureStart = failures.length
          await attempt(first, async () => {
            const wholeGroup =
              unit.groupId !== undefined && destination.groupId === undefined
            if (!wholeGroup) {
              for (const id of unit.tabIds) {
                const tab = await api.tabs.get(id)
                if (tab.windowId !== destination.windowId)
                  await api.tabs.move(id, {
                    windowId: destination.windowId,
                    index: -1,
                  })
                if (destination.groupId !== undefined) {
                  if (
                    tab.groupId !== destination.groupId ||
                    tab.windowId !== destination.windowId
                  )
                    await api.tabs.group({
                      tabIds: id,
                      groupId: destination.groupId,
                    })
                } else if (tab.groupId >= 0) await api.tabs.ungroup(id)
              }
            }
            const current = (
              await api.tabs.query({ windowId: destination.windowId })
            )
              .filter((tab) => !unit.tabIds.includes(tab.id!))
              .sort((a, b) => a.index - b.index)
            const index =
              anchor === undefined
                ? -1
                : current.findIndex((tab) => tab.id === anchor)
            if (anchor !== undefined && index < 0)
              throw new Error('The insertion position is no longer available.')
            if (wholeGroup)
              await requireGroups().move(unit.groupId!, {
                windowId: destination.windowId,
                index,
              })
            else
              await api.tabs.move(unit.tabIds, {
                windowId: destination.windowId,
                index,
              })
          })
          if (failures.length === failureStart) {
            succeededIds.push(...unit.tabIds.slice(1))
            anchor = first
          } else {
            failures.push(
              ...unit.tabIds.slice(1).map((id) => ({
                id,
                message: failures[failureStart]!.message,
              })),
            )
          }
        }
        break
      }
      case 'move-tabs': {
        let windowId = command.windowId
        let blankTabId: number | undefined
        for (const unit of getTabMoveUnits(requestedIds, snapshot)) {
          const id = unit.tabIds[0]!
          const failureStart = failures.length
          await attempt(id, async () => {
            const source = snapshot.tabs.find((tab) => tab.id === id)
            if (windowId === undefined) {
              const window = await api.windows.create({
                ...(unit.groupId === undefined ? { tabId: id } : {}),
                type: 'normal',
                incognito: snapshot.windows.find(
                  (window) => window.id === source?.windowId,
                )?.incognito,
                focused: false,
              })
              if (!window || !hasId(window))
                throw new Error('Chrome did not return the created window.')
              windowId = window.id
              createdWindowIds = [window.id]
              if (unit.groupId !== undefined) blankTabId = window.tabs?.[0]?.id
              else return
            }
            if (source?.windowId === windowId) return
            if (unit.groupId !== undefined)
              await requireGroups().move(unit.groupId, { windowId, index: -1 })
            else
              await api.tabs.move(id, {
                windowId,
                index: source?.pinned
                  ? (await api.tabs.query({ windowId, pinned: true })).length
                  : -1,
              })
          })
          if (failures.length === failureStart)
            succeededIds.push(...unit.tabIds.slice(1))
          else
            failures.push(
              ...unit.tabIds.slice(1).map((id) => ({
                id,
                message: failures[failureStart]!.message,
              })),
            )
          if (windowId === undefined) {
            failures.push(
              ...requestedIds
                .filter((id) => !failures.some((failure) => failure.id === id))
                .map((id) => ({
                  id,
                  message: 'The destination window could not be created.',
                })),
            )
            break
          }
        }
        if (
          blankTabId !== undefined &&
          succeededIds.length &&
          running &&
          generation === commandGeneration
        ) {
          try {
            await api.tabs.remove(blankTabId)
          } catch {
            /* Keep Chrome's blank tab if cleanup is unavailable. */
          }
        }
        break
      }
      case 'group-tabs': {
        let groupId = command.groupId
        for (const id of requestedIds)
          await attempt(id, async () => {
            const created = await api.tabs.group({
              tabIds: id,
              ...(groupId === undefined
                ? {
                    createProperties: {
                      windowId: snapshot.tabs.find((tab) => tab.id === id)!
                        .windowId,
                    },
                  }
                : { groupId }),
            })
            if (groupId === undefined) {
              groupId = created
              createdGroupIds = [created]
            }
          })
        break
      }
      case 'group-action':
        for (const id of requestedIds)
          await attempt(id, async () => {
            const groups = requireGroups(),
              action = command.action
            if (
              action.type === 'move-backward' ||
              action.type === 'move-forward'
            ) {
              const index = planGroupMove(
                snapshot,
                id,
                action.type === 'move-backward' ? 'backward' : 'forward',
              )
              if (index !== undefined) await groups.move(id, { index })
            } else
              await groups.update(
                id,
                action.type === 'rename'
                  ? { title: action.title }
                  : action.type === 'change-color'
                    ? { color: action.color }
                    : { collapsed: action.collapsed },
              )
          })
        break
      case 'move-group':
        await attempt(command.groupId, async () => {
          const groups = requireGroups()
          let windowId = command.windowId,
            blankTabId: number | undefined
          if (windowId === undefined) {
            const source = snapshot.windows.find(
              (window) =>
                window.id ===
                snapshot.groups.find((group) => group.id === command.groupId)
                  ?.windowId,
            )
            const window = await api.windows.create({
              type: 'normal',
              incognito: source?.incognito,
              focused: false,
            })
            if (!window || !hasId(window))
              throw new Error('Chrome did not return the created window.')
            windowId = window.id
            blankTabId = window.tabs?.[0]?.id
            createdWindowIds = [windowId]
          }
          if (!running || generation !== commandGeneration)
            throw new Error('The browser connection was stopped.')
          await groups.move(command.groupId, { windowId, index: -1 })
          if (
            blankTabId !== undefined &&
            running &&
            generation === commandGeneration
          )
            await api.tabs.remove(blankTabId)
        })
        break
      case 'move-tab':
        await attempt(command.tabId, async () => {
          const plan = planTabMove(snapshot, command.tabId, command.direction)
          if (plan.type === 'move')
            await api.tabs.move(command.tabId, { index: plan.index })
          else if (plan.type === 'group')
            await api.tabs.group({
              tabIds: command.tabId,
              groupId: plan.groupId,
            })
          else if (plan.type === 'ungroup')
            await api.tabs.ungroup(command.tabId)
        })
        break
      case 'close-relative-tabs':
        for (const id of requestedIds)
          await attempt(id, () => api.tabs.remove(id))
        break
      case 'create-window':
        try {
          const source =
            command.sourceWindowId === undefined
              ? undefined
              : await api.windows.get(command.sourceWindowId)
          if (!running || generation !== commandGeneration)
            throw new Error('The browser connection was stopped.')
          const window = await api.windows.create({
            type: 'normal',
            url: command.url,
            focused: true,
            ...(source
              ? {
                  incognito: source.incognito,
                  state: source.state,
                  ...(source.state === undefined || source.state === 'normal'
                    ? {
                        height: source.height,
                        left: source.left,
                        top: source.top,
                        width: source.width,
                      }
                    : {}),
                }
              : {}),
          })
          if (!window || !hasId(window)) {
            throw new Error('Chrome did not return the created window.')
          }
          createdWindowIds = [window.id]
          createdTabIds = window.tabs?.filter(hasId).map((tab) => tab.id)
        } catch (error) {
          failures.push({ id: -1, message: errorMessage(error) })
        }
        break
      case 'close-tabs':
        for (const id of requestedIds) {
          await attempt(id, () => api.tabs.remove(id))
        }
        break
      case 'window-action':
        for (const id of requestedIds)
          await attempt(id, () =>
            command.action === 'close'
              ? api.windows.remove(id)
              : api.windows.update(id, { focused: true }),
          )
        break
      case 'close-window':
        await attempt(command.windowId, () =>
          api.windows.remove(command.windowId),
        )
        break
      case 'activate-tab':
        await attempt(command.tabId, async () => {
          const tab = await api.tabs.update(command.tabId, { active: true })
          if (!tab) throw new Error('Chrome did not return the activated tab.')
          if (!running || generation !== commandGeneration) {
            throw new Error('The browser connection was stopped.')
          }
          await api.windows.update(tab.windowId, { focused: true })
        })
        break
      case 'activate-window':
        await attempt(command.windowId, () =>
          api.windows.update(command.windowId, { focused: true }),
        )
        break
      case 'set-group-collapsed':
        await attempt(command.groupId, () => {
          if (!api.tabGroups) {
            throw new Error('Tab groups are unavailable in this browser.')
          }
          return api.tabGroups.update(command.groupId, {
            collapsed: command.collapsed,
          })
        })
        break
    }
    if (running && generation === commandGeneration) await invalidate()
    return createCommandOutcome(requestedIds, succeededIds, failures, {
      ...(createdWindowIds ? { createdWindowIds } : {}),
      ...(createdTabIds ? { createdTabIds } : {}),
      ...(createdGroupIds ? { createdGroupIds } : {}),
      ...(command.type === 'tab-action' && command.action === 'discard'
        ? { skippedActiveIds, skippedAlreadyDiscardedIds }
        : {}),
    })
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      subscribers.add(listener)
      return () => subscribers.delete(listener)
    },
    start,
    execute,
    dispose: () => {
      running = false
      generation += 1
      refreshTask = undefined
      removeListeners.forEach((remove) => remove())
      removeListeners = []
    },
  }
}
