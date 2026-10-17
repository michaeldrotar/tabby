import { createAsyncQueue } from '@extension/core/asyncQueue'
import { BROWSER_TAB_GROUP_COLORS } from '@extension/core/browser'
import {
  matchWindowIdentities,
  WINDOW_ICONS,
} from '@extension/core/windowIdentity'
import type { BrowserTabGroupColor } from '@extension/core/browser'
import type { SavedWindowIdentity } from '@extension/core/windowIdentity'

export const WINDOW_IDENTITIES_KEY = 'tabby-window-identities'
export const WINDOW_LABELS_KEY = 'tabby-window-labels-v1'
export type WindowIdentityAssignment = {
  key: string
  name: string
  icon?: string
  iconColor?: BrowserTabGroupColor
  provisional?: boolean
}
type Assignments = Record<string, WindowIdentityAssignment>
type IdentityApi = Pick<
  typeof chrome,
  'windows' | 'tabs' | 'runtime' | 'storage'
>

const fingerprint = async (tabs: chrome.tabs.Tab[]) =>
  Promise.all(
    tabs
      .flatMap((tab) => {
        const url = tab.pendingUrl || tab.url
        return url && /^(https?|file):/.test(url) ? [url] : []
      })
      .map(async (url) => {
        const digest = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(url),
        )
        return Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('')
      }),
  )

/** The service worker is the single writer for identities across all extension surfaces. */
export const registerWindowIdentities = (api: IdentityApi) => {
  const queue = createAsyncQueue()
  const reconcile = async (
    edit?: {
      windowId: number
      name: string
      icon?: string
      iconColor?: BrowserTabGroupColor
    },
    removedId?: number,
    confirmRestores = false,
  ) => {
    const [windows, local, session] = await Promise.all([
      api.windows.getAll({ populate: true, windowTypes: ['normal'] }),
      api.storage.local.get(WINDOW_LABELS_KEY),
      api.storage.session.get(WINDOW_IDENTITIES_KEY),
    ])
    const now = Date.now()
    let saved: SavedWindowIdentity[] = Array.isArray(local[WINDOW_LABELS_KEY])
      ? local[WINDOW_LABELS_KEY]
      : []
    saved = saved.filter(
      (record) =>
        typeof record.key === 'string' &&
        typeof record.name === 'string' &&
        Array.isArray(record.hashes) &&
        now - record.updatedAt < 90 * 86400000,
    )
    const previous = (session[WINDOW_IDENTITIES_KEY] ?? {}) as Assignments
    const assignments: Assignments = {}
    for (const window of windows) {
      if (
        window.id !== undefined &&
        window.id !== removedId &&
        previous[window.id] &&
        !previous[window.id]?.provisional
      )
        assignments[window.id] = previous[window.id]!
    }
    const fingerprints = await Promise.all(
      windows
        .filter((window) => window.id !== undefined && !window.incognito)
        .map(async (window) => ({
          id: window.id!,
          hashes: await fingerprint(window.tabs ?? []),
        })),
    )
    const boundKeys = new Set(
      Object.values(assignments).map((value) => value.key),
    )
    const restored = matchWindowIdentities(
      fingerprints.filter((window) => !assignments[window.id]),
      saved.filter((record) => !boundKeys.has(record.key)),
    )
    for (const [id, key] of restored) {
      if (!assignments[id]) {
        const record = saved.find((record) => record.key === key)!
        assignments[id] = {
          key,
          name: record.name,
          icon: record.icon,
          iconColor: record.iconColor,
          provisional:
            !confirmRestores ||
            windows.some((window) =>
              window.tabs?.some(
                (tab) => tab.status === 'loading' && !tab.discarded,
              ),
            ),
        }
      }
    }
    if (edit) {
      const window = windows.find((window) => window.id === edit.windowId)
      if (!window) throw new Error('This window is no longer available.')
      const existing = assignments[edit.windowId]
      const name = edit.name.trim().slice(0, 120)
      const icon = WINDOW_ICONS.find((icon) => icon === edit.icon)
      const iconColor = BROWSER_TAB_GROUP_COLORS.find(
        (color) => color === edit.iconColor,
      )
      if (!name && !icon) {
        delete assignments[edit.windowId]
        saved = saved.filter((record) => record.key !== existing?.key)
      } else
        assignments[edit.windowId] = {
          key: existing?.key ?? crypto.randomUUID(),
          name,
          icon,
          iconColor: icon ? iconColor : undefined,
        }
    }
    for (const window of windows) {
      const assigned = assignments[window.id ?? -1]
      if (!assigned || assigned.provisional || window.incognito) continue
      const hashes =
        fingerprints.find((item) => item.id === window.id)?.hashes ?? []
      const existing = saved.find((record) => record.key === assigned.key)
      const record: SavedWindowIdentity = {
        key: assigned.key,
        name: assigned.name,
        icon: assigned.icon,
        iconColor: assigned.iconColor,
        hashes: hashes.length ? hashes : (existing?.hashes ?? []),
        updatedAt: Math.floor(now / 86400000) * 86400000,
      }
      saved = saved.filter((item) => item.key !== record.key)
      saved.push(record)
    }
    saved = saved.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 200)
    if (
      JSON.stringify(saved) !== JSON.stringify(local[WINDOW_LABELS_KEY] ?? [])
    )
      await api.storage.local.set({ [WINDOW_LABELS_KEY]: saved })
    if (JSON.stringify(assignments) !== JSON.stringify(previous))
      await api.storage.session.set({ [WINDOW_IDENTITIES_KEY]: assignments })
  }
  const update = (
    edit?: {
      windowId: number
      name: string
      icon?: string
      iconColor?: BrowserTabGroupColor
    },
    removedId?: number,
  ) => queue.run(() => reconcile(edit, removedId))
  let refreshTask: Promise<void> | undefined
  let dirty = false
  let restoreTimer: ReturnType<typeof setTimeout> | undefined
  const changed = () => {
    clearTimeout(restoreTimer)
    restoreTimer = setTimeout(() => {
      void queue
        .run(() => reconcile(undefined, undefined, true))
        .catch(console.error)
    }, 2000)
    dirty = true
    if (refreshTask) return
    refreshTask = queue.run(async () => {
      try {
        do {
          dirty = false
          await reconcile()
        } while (dirty)
      } finally {
        refreshTask = undefined
      }
    })
    void refreshTask.catch(console.error)
  }
  const removed = (id: number) => {
    void update(undefined, id).catch(console.error)
    changed()
  }
  const events: { addListener: (listener: () => void) => void }[] = [
    api.windows.onCreated,
    api.tabs.onCreated,
    api.tabs.onUpdated,
    api.tabs.onRemoved,
    api.tabs.onAttached,
    api.tabs.onDetached,
    api.tabs.onMoved,
  ]
  for (const event of events) event.addListener(changed)
  api.windows.onRemoved.addListener(removed)
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== 'tabby-name-window' || sender.id !== api.runtime.id)
      return
    if (!Number.isInteger(message.windowId) || typeof message.name !== 'string')
      return
    void (async () => {
      try {
        await update(message)
        respond({ success: true })
      } catch (error) {
        respond({
          error:
            error instanceof Error
              ? error.message
              : 'Could not save window name.',
        })
      }
    })()
    return true
  })
  changed()
  return { settled: () => queue.wait() }
}
