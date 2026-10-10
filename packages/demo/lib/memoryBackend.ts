import { getCommandTargetIds } from '@extension/core'
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
    const ids = getCommandTargetIds(command)
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
    let snapshot = copySnapshot(this.snapshot)
    const succeededIds: number[] = []
    const failures: { id: number; message: string }[] = []
    let createdWindowIds: number[] | undefined
    let createdTabIds: number[] | undefined
    const requireId = (id: number, exists: boolean) => {
      if (exists) succeededIds.push(id)
      else failures.push({ id, message: `Item ${id} no longer exists` })
      return exists
    }
    switch (command.type) {
      case 'create-window': {
        const windowId = this.nextWindowId++
        const tabId = this.nextTabId++
        snapshot.windows = [
          ...snapshot.windows.map((window) => ({ ...window, focused: false })),
          { id: windowId, type: 'normal', focused: true, incognito: false },
        ]
        snapshot.tabs = [
          ...snapshot.tabs,
          {
            id: tabId,
            windowId,
            index: 0,
            title: 'New Tab',
            url: 'about:blank',
            active: true,
          },
        ]
        createdWindowIds = [windowId]
        createdTabIds = [tabId]
        break
      }
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
    const changed = succeededIds.length > 0 || Boolean(createdWindowIds)
    if (changed) {
      snapshot = this.normalize(snapshot)
      this.publish({ ...snapshot, revision: this.snapshot.revision + 1 })
    }
    return {
      status: failures.length
        ? succeededIds.length
          ? 'partial'
          : 'failed'
        : 'success',
      requestedIds: ids,
      succeededIds,
      failures,
      ...(createdWindowIds ? { createdWindowIds, createdTabIds } : {}),
    }
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
