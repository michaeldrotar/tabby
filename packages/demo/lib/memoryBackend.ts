import {
  createCommandOutcome,
  getCommandBlockReason,
  getCommandTargetIds,
  insertTabs,
  planGroupMove,
  planTabMove,
} from '@extension/core'
import type {
  BrowserBackend,
  BrowserCommand,
  BrowserSnapshot,
  CommandOutcome,
} from '@extension/core'

export interface MemoryCheckpoint {
  snapshot: BrowserSnapshot
  nextWindowId: number
  nextTabId: number
  nextGroupId: number
}

export interface MemoryBackendOptions {
  commands?: 'apply' | 'ignore'
  beforeExecute?: (command: BrowserCommand) => void | Promise<void>
}

const copySnapshot = (snapshot: BrowserSnapshot): BrowserSnapshot => ({
  ...snapshot,
  windows: snapshot.windows.map((window) => ({ ...window })),
  tabs: snapshot.tabs.map((tab) => ({ ...tab })),
  groups: snapshot.groups.map((group) => ({ ...group })),
})

/** An instance owns all data, subscriptions, pending work and identifier allocation. */
export class MemoryBackend implements BrowserBackend {
  private snapshot: BrowserSnapshot
  private listeners = new Set<() => void>()
  private nextWindowId = 1
  private nextTabId = 1
  private nextGroupId = 1
  private generation = 0

  constructor(
    snapshot: BrowserSnapshot,
    private options: MemoryBackendOptions = {},
  ) {
    this.snapshot = copySnapshot(snapshot)
    this.resetAllocators()
  }

  getSnapshot = (): BrowserSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start = async (): Promise<void> => {}

  dispose = (): void => {
    this.generation += 1
    this.listeners.clear()
  }

  exportSnapshot = (): BrowserSnapshot => copySnapshot(this.snapshot)

  capture = (): MemoryCheckpoint => ({
    snapshot: this.exportSnapshot(),
    nextWindowId: this.nextWindowId,
    nextTabId: this.nextTabId,
    nextGroupId: this.nextGroupId,
  })

  restore = (checkpoint: MemoryCheckpoint): void => {
    this.generation += 1
    this.nextWindowId = checkpoint.nextWindowId
    this.nextTabId = checkpoint.nextTabId
    this.nextGroupId = checkpoint.nextGroupId
    this.publish(copySnapshot(checkpoint.snapshot))
  }

  restoreSnapshot = (snapshot: BrowserSnapshot): void => {
    this.generation += 1
    this.snapshot = copySnapshot(snapshot)
    this.resetAllocators()
    this.publish(this.snapshot)
  }

  execute = async (command: BrowserCommand): Promise<CommandOutcome> => {
    const ids = getCommandTargetIds(command, this.snapshot)
    const ignored: CommandOutcome = {
      status: 'ignored',
      requestedIds: ids,
      succeededIds: [],
      failures: [],
    }
    if (this.options.commands === 'ignore') return ignored
    const generation = this.generation
    await this.options.beforeExecute?.(command)
    if (generation !== this.generation) return ignored
    const blockReason = getCommandBlockReason(command, this.snapshot)
    if (blockReason)
      return createCommandOutcome(
        ids,
        [],
        (ids.length ? ids : [-1]).map((id) => ({ id, message: blockReason })),
      )
    let snapshot = copySnapshot(this.snapshot)
    const succeededIds: number[] = []
    const failures: { id: number; message: string }[] = []
    let createdWindowIds: number[] | undefined
    let createdTabIds: number[] | undefined
    let createdGroupIds: number[] | undefined
    const skippedActiveIds: number[] = []
    const skippedAlreadyDiscardedIds: number[] = []
    const requireId = (id: number, exists: boolean) => {
      if (exists) succeededIds.push(id)
      else failures.push({ id, message: `Item ${id} no longer exists` })
      return exists
    }
    switch (command.type) {
      case 'create-tab': {
        const windowId =
          command.windowId ??
          snapshot.groups.find((group) => group.id === command.groupId)
            ?.windowId ??
          snapshot.windows.find((window) => window.focused)?.id ??
          snapshot.windows[0]?.id
        if (
          windowId === undefined ||
          !snapshot.windows.some((window) => window.id === windowId)
        ) {
          failures.push({
            id: windowId ?? -1,
            message: 'The destination window is no longer available.',
          })
          break
        }
        const id = this.nextTabId++
        snapshot.windows = snapshot.windows.map((window) => ({
          ...window,
          focused: window.id === windowId,
        }))
        snapshot.tabs = snapshot.tabs.map((tab) =>
          tab.windowId === windowId ? { ...tab, active: false } : tab,
        )
        snapshot.tabs = insertTabs(
          snapshot.tabs,
          [
            {
              id,
              windowId,
              index: 0,
              title: command.url ?? 'New Tab',
              url: command.url ?? 'about:blank',
              active: true,
              groupId: command.groupId,
            },
          ],
          windowId,
          command.groupId === undefined
            ? -1
            : Math.max(
                ...snapshot.tabs
                  .filter((tab) => tab.groupId === command.groupId)
                  .map((tab) => tab.index),
              ) + 1,
        )
        createdTabIds = [id]
        break
      }
      case 'navigate-tab': {
        const tab = snapshot.tabs.find((tab) => tab.id === command.tabId)
        if (requireId(command.tabId, Boolean(tab)) && tab)
          snapshot.tabs = snapshot.tabs.map((candidate) =>
            candidate.windowId === tab.windowId
              ? {
                  ...candidate,
                  active: candidate.id === tab.id,
                  ...(candidate.id === tab.id
                    ? { url: command.url, title: command.url, discarded: false }
                    : {}),
                }
              : candidate,
          )
        break
      }
      case 'move-group': {
        const group = snapshot.groups.find(
          (group) => group.id === command.groupId,
        )
        if (!requireId(command.groupId, Boolean(group)) || !group) break
        let windowId = command.windowId
        if (windowId === undefined) {
          windowId = this.nextWindowId++
          snapshot.windows = [
            ...snapshot.windows.map((window) => ({
              ...window,
              focused: false,
            })),
            {
              id: windowId,
              type: 'normal',
              incognito:
                snapshot.windows.find((window) => window.id === group.windowId)
                  ?.incognito ?? false,
              focused: true,
            },
          ]
          createdWindowIds = [windowId]
        }
        const members = snapshot.tabs
          .filter((tab) => tab.groupId === group.id)
          .sort((a, b) => a.index - b.index)
        const targetHasActive = snapshot.tabs.some(
          (tab) => tab.windowId === windowId && tab.active,
        )
        snapshot.tabs = insertTabs(
          snapshot.tabs,
          members.map((tab, index) => ({
            ...tab,
            active: !targetHasActive && index === 0,
          })),
          windowId,
          -1,
        )
        snapshot.groups = snapshot.groups.map((candidate) =>
          candidate.id === group.id ? { ...candidate, windowId } : candidate,
        )
        snapshot.windows = snapshot.windows.filter((window) =>
          snapshot.tabs.some((tab) => tab.windowId === window.id),
        )
        break
      }
      case 'tab-action': {
        for (const id of ids) {
          const tab = snapshot.tabs.find((tab) => tab.id === id)
          if (!tab) {
            requireId(id, false)
            continue
          }
          if (command.action === 'discard' && (tab.active || tab.discarded)) {
            ;(tab.active ? skippedActiveIds : skippedAlreadyDiscardedIds).push(
              id,
            )
            continue
          }
          requireId(id, true)
          if (command.action === 'duplicate') {
            const cloneId = this.nextTabId++
            snapshot.tabs = insertTabs(
              snapshot.tabs.map((candidate) =>
                candidate.windowId === tab.windowId
                  ? { ...candidate, active: false }
                  : candidate,
              ),
              [{ ...tab, id: cloneId, renderKey: cloneId, active: true }],
              tab.windowId,
              tab.index + 1,
            )
            createdTabIds = [...(createdTabIds ?? []), cloneId]
          } else {
            snapshot.tabs = snapshot.tabs.map((candidate) =>
              candidate.id !== id
                ? candidate
                : {
                    ...candidate,
                    ...(command.action === 'pin'
                      ? { pinned: true, groupId: undefined }
                      : {}),
                    ...(command.action === 'unpin' ? { pinned: false } : {}),
                    ...(command.action === 'mute' ? { muted: true } : {}),
                    ...(command.action === 'unmute' ? { muted: false } : {}),
                    ...(command.action === 'discard'
                      ? { discarded: true }
                      : {}),
                    ...(command.action === 'reload'
                      ? { discarded: false, loading: false, hasLoaded: true }
                      : {}),
                    ...(command.action === 'ungroup'
                      ? { groupId: undefined }
                      : {}),
                  },
            )
            if (command.action === 'ungroup' && tab.groupId !== undefined) {
              const remaining = snapshot.tabs
                .filter(
                  (candidate) =>
                    candidate.windowId === tab.windowId && candidate.id !== id,
                )
                .sort((a, b) => a.index - b.index)
              const members = remaining.filter(
                (candidate) => candidate.groupId === tab.groupId,
              )
              const atStart =
                tab.index <
                Math.min(...members.map((candidate) => candidate.index))
              const index = atStart
                ? tab.index
                : Math.max(
                    ...members.map((candidate) =>
                      remaining.findIndex((item) => item.id === candidate.id),
                    ),
                  ) + 1
              snapshot.tabs = insertTabs(
                snapshot.tabs,
                [snapshot.tabs.find((candidate) => candidate.id === id)!],
                tab.windowId,
                index,
              )
            }
            if (command.action === 'pin' || command.action === 'unpin') {
              const updated = snapshot.tabs.find(
                (candidate) => candidate.id === id,
              )!
              const pinned = snapshot.tabs.filter(
                (candidate) =>
                  candidate.windowId === tab.windowId &&
                  candidate.pinned &&
                  candidate.id !== id,
              ).length
              snapshot.tabs = insertTabs(
                snapshot.tabs,
                [updated],
                tab.windowId,
                pinned,
              )
            }
          }
        }
        break
      }
      case 'move-tabs': {
        let windowId = command.windowId
        if (windowId === undefined) {
          windowId = this.nextWindowId++
          const source = snapshot.windows.find(
            (window) =>
              window.id ===
              snapshot.tabs.find((tab) => tab.id === ids[0])?.windowId,
          )
          snapshot.windows = [
            ...snapshot.windows.map((window) => ({
              ...window,
              focused: false,
            })),
            {
              id: windowId,
              type: 'normal',
              incognito: source?.incognito ?? false,
              focused: true,
            },
          ]
          createdWindowIds = [windowId]
        }
        for (const id of ids) {
          const tab = snapshot.tabs.find((tab) => tab.id === id)
          if (!requireId(id, Boolean(tab)) || !tab) continue
          if (tab.windowId === windowId) continue
          const targetHasActive = snapshot.tabs.some(
            (candidate) => candidate.windowId === windowId && candidate.active,
          )
          const pinIndex = tab.pinned
            ? snapshot.tabs.filter(
                (candidate) =>
                  candidate.windowId === windowId && candidate.pinned,
              ).length
            : -1
          snapshot.tabs = insertTabs(
            snapshot.tabs,
            [
              {
                ...tab,
                windowId,
                groupId: undefined,
                active: !targetHasActive,
              },
            ],
            windowId,
            pinIndex,
          )
        }
        snapshot.windows = snapshot.windows.filter((window) =>
          snapshot.tabs.some((tab) => tab.windowId === window.id),
        )
        break
      }
      case 'group-tabs': {
        const tabs = ids.flatMap((id) =>
          snapshot.tabs.filter((tab) => tab.id === id),
        )
        const windowId = tabs[0]!.windowId
        let groupId = command.groupId
        if (groupId === undefined) {
          groupId = this.nextGroupId++
          snapshot.groups = [
            ...snapshot.groups,
            {
              id: groupId,
              windowId,
              color: 'grey',
              collapsed: false,
              title: '',
            },
          ]
          createdGroupIds = [groupId]
        }
        const members = snapshot.tabs.filter(
          (tab) => tab.groupId === groupId && !ids.includes(tab.id),
        )
        const remaining = snapshot.tabs
          .filter((tab) => tab.windowId === windowId && !ids.includes(tab.id))
          .sort((a, b) => a.index - b.index)
        const index = members.length
          ? Math.max(
              ...members.map((tab) =>
                remaining.findIndex((candidate) => candidate.id === tab.id),
              ),
            ) + 1
          : Math.min(...tabs.map((tab) => tab.index))
        snapshot.tabs = insertTabs(
          snapshot.tabs,
          tabs.map((tab) => ({ ...tab, groupId, pinned: false })),
          windowId,
          index,
        )
        succeededIds.push(...ids)
        break
      }
      case 'group-action': {
        for (const id of ids) {
          const group = snapshot.groups.find((group) => group.id === id)
          if (!requireId(id, Boolean(group)) || !group) continue
          const action = command.action
          if (
            action.type === 'move-backward' ||
            action.type === 'move-forward'
          ) {
            const index = planGroupMove(
              snapshot,
              id,
              action.type === 'move-backward' ? 'backward' : 'forward',
            )
            if (index !== undefined)
              snapshot.tabs = insertTabs(
                snapshot.tabs,
                snapshot.tabs
                  .filter((tab) => tab.groupId === id)
                  .sort((a, b) => a.index - b.index),
                group.windowId,
                index,
              )
          } else
            snapshot.groups = snapshot.groups.map((candidate) =>
              candidate.id !== id
                ? candidate
                : {
                    ...candidate,
                    ...(action.type === 'rename'
                      ? { title: action.title }
                      : action.type === 'change-color'
                        ? { color: action.color }
                        : { collapsed: action.collapsed }),
                  },
            )
        }
        break
      }
      case 'move-tab': {
        const tab = snapshot.tabs.find((tab) => tab.id === command.tabId)
        if (!requireId(command.tabId, Boolean(tab)) || !tab) break
        const plan = planTabMove(snapshot, tab.id, command.direction)
        if (plan.type === 'move')
          snapshot.tabs = insertTabs(
            snapshot.tabs,
            [tab],
            tab.windowId,
            plan.index,
          )
        else if (plan.type === 'ungroup')
          snapshot.tabs = snapshot.tabs.map((candidate) =>
            candidate.id === tab.id
              ? { ...candidate, groupId: undefined }
              : candidate,
          )
        else if (plan.type === 'group') {
          const members = snapshot.tabs.filter(
            (candidate) => candidate.groupId === plan.groupId,
          )
          const index =
            command.direction === 'backward'
              ? Math.max(...members.map((candidate) => candidate.index)) + 1
              : Math.min(...members.map((candidate) => candidate.index))
          snapshot.tabs = insertTabs(
            snapshot.tabs,
            [{ ...tab, groupId: plan.groupId, pinned: false }],
            tab.windowId,
            index,
          )
        }
        break
      }
      case 'create-window': {
        const windowId = this.nextWindowId++
        const tabId = this.nextTabId++
        snapshot.windows = [
          ...snapshot.windows.map((window) => ({ ...window, focused: false })),
          {
            id: windowId,
            type: 'normal',
            focused: true,
            incognito:
              snapshot.windows.find(
                (window) => window.id === command.sourceWindowId,
              )?.incognito ?? false,
          },
        ]
        snapshot.tabs = [
          ...snapshot.tabs,
          {
            id: tabId,
            windowId,
            index: 0,
            title: command.url ?? 'New Tab',
            url: command.url ?? 'about:blank',
            active: true,
          },
        ]
        createdWindowIds = [windowId]
        createdTabIds = [tabId]
        break
      }
      case 'close-relative-tabs':
      case 'close-tabs': {
        ids.forEach((id) =>
          requireId(
            id,
            snapshot.tabs.some((tab) => tab.id === id),
          ),
        )
        const removed = new Set(succeededIds)
        snapshot.tabs = snapshot.tabs.filter((tab) => !removed.has(tab.id))
        snapshot.windows = snapshot.windows.filter((window) =>
          snapshot.tabs.some((tab) => tab.windowId === window.id),
        )
        break
      }
      case 'window-action':
        for (const id of ids) {
          if (
            !requireId(
              id,
              snapshot.windows.some((window) => window.id === id),
            )
          )
            continue
          if (command.action === 'close') {
            snapshot.windows = snapshot.windows.filter(
              (window) => window.id !== id,
            )
            snapshot.tabs = snapshot.tabs.filter((tab) => tab.windowId !== id)
          } else
            snapshot.windows = snapshot.windows.map((window) => ({
              ...window,
              focused: window.id === id,
            }))
        }
        break
      case 'close-window':
        if (
          requireId(
            command.windowId,
            snapshot.windows.some((window) => window.id === command.windowId),
          )
        ) {
          snapshot.windows = snapshot.windows.filter(
            (window) => window.id !== command.windowId,
          )
          snapshot.tabs = snapshot.tabs.filter(
            (tab) => tab.windowId !== command.windowId,
          )
        }
        break
      case 'activate-tab': {
        const target = snapshot.tabs.find((tab) => tab.id === command.tabId)
        if (requireId(command.tabId, Boolean(target)) && target) {
          snapshot.tabs = snapshot.tabs.map((tab) =>
            tab.windowId === target.windowId
              ? {
                  ...tab,
                  active: tab.id === target.id,
                  ...(tab.id === target.id ? { discarded: false } : {}),
                }
              : tab,
          )
          snapshot.windows = snapshot.windows.map((window) => ({
            ...window,
            focused: window.id === target.windowId,
          }))
        }
        break
      }
      case 'activate-window':
        if (
          requireId(
            command.windowId,
            snapshot.windows.some((window) => window.id === command.windowId),
          )
        ) {
          snapshot.windows = snapshot.windows.map((window) => ({
            ...window,
            focused: window.id === command.windowId,
          }))
        }
        break
      case 'set-group-collapsed':
        if (
          requireId(
            command.groupId,
            snapshot.groups.some((group) => group.id === command.groupId),
          )
        ) {
          snapshot.groups = snapshot.groups.map((group) =>
            group.id === command.groupId
              ? { ...group, collapsed: command.collapsed }
              : group,
          )
        }
        break
    }
    const changed =
      succeededIds.length > 0 ||
      Boolean(createdWindowIds) ||
      Boolean(createdTabIds)
    if (changed) {
      snapshot = this.normalize(snapshot)
      this.publish({ ...snapshot, revision: this.snapshot.revision + 1 })
    }
    return createCommandOutcome(ids, succeededIds, failures, {
      ...(createdWindowIds ? { createdWindowIds } : {}),
      ...(createdTabIds ? { createdTabIds } : {}),
      ...(createdGroupIds ? { createdGroupIds } : {}),
      ...(command.type === 'tab-action' && command.action === 'discard'
        ? { skippedActiveIds, skippedAlreadyDiscardedIds }
        : {}),
    })
  }

  private normalize(snapshot: BrowserSnapshot): BrowserSnapshot {
    const windows = snapshot.windows.map((window, index) => ({
      ...window,
      focused: snapshot.windows.some((item) => item.focused)
        ? window.focused
        : index === 0,
    }))
    const groups = snapshot.groups.filter(
      (group) =>
        windows.some((window) => window.id === group.windowId) &&
        snapshot.tabs.some((tab) => tab.groupId === group.id),
    )
    const tabs = windows.flatMap((window) => {
      const windowTabs = snapshot.tabs
        .filter((tab) => tab.windowId === window.id)
        .sort((left, right) => left.index - right.index)
      const activeIndex = Math.max(
        0,
        windowTabs.findIndex((tab) => tab.active),
      )
      return windowTabs.map((tab, index) => ({
        ...tab,
        index,
        active: index === activeIndex,
        ...(tab.groupId !== undefined &&
        !groups.some((group) => group.id === tab.groupId)
          ? { groupId: undefined }
          : {}),
      }))
    })
    return { ...snapshot, windows, tabs, groups }
  }

  private resetAllocators(): void {
    this.nextWindowId =
      Math.max(0, ...this.snapshot.windows.map((w) => w.id)) + 1
    this.nextTabId = Math.max(0, ...this.snapshot.tabs.map((tab) => tab.id)) + 1
    this.nextGroupId = Math.max(0, ...this.snapshot.groups.map((g) => g.id)) + 1
  }

  private publish(snapshot: BrowserSnapshot): void {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}
