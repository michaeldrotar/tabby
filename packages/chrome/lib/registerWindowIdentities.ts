import { createAsyncQueue } from '@extension/core/asyncQueue'
import { BROWSER_TAB_GROUP_COLORS } from '@extension/core/browser'
import {
  countMatchingWindowHashes,
  matchWindowIdentities,
  WINDOW_ICONS,
} from '@extension/core/windowIdentity'
import type { BrowserTabGroupColor } from '@extension/core/browser'
import type { SavedWindowIdentity } from '@extension/core/windowIdentity'

export const WINDOW_IDENTITIES_KEY = 'tabby-window-identities'
export const WINDOW_LABELS_KEY = 'tabby-window-labels-v1'
export const WINDOW_RESTORE_ALARM = 'tabby-confirm-window-identities'
const RESTORE_SETTLE_MS = 30_000
export type WindowIdentityAssignment = {
  key: string
  name: string
  icon?: string
  iconColor?: BrowserTabGroupColor
  provisional?: boolean
  matchedFull?: boolean
  confirmAfter?: number
  hashes?: string[]
  position?: number
  cleared?: boolean
}
type Assignments = Record<string, WindowIdentityAssignment>
type IdentityApi = Pick<
  typeof chrome,
  'windows' | 'tabs' | 'runtime' | 'storage' | 'alarms'
>

const confirmationDeadline = (
  prior: WindowIdentityAssignment | undefined,
  key: string,
  hashes: string[],
  now: number,
) =>
  prior?.key === key && JSON.stringify(prior.hashes) === JSON.stringify(hashes)
    ? (prior.confirmAfter ?? now + RESTORE_SETTLE_MS)
    : now + RESTORE_SETTLE_MS

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
        assignments[window.id] = { ...previous[window.id]! }
    }
    const fingerprints = await Promise.all(
      windows
        .filter((window) => window.id !== undefined && !window.incognito)
        .sort((a, b) => a.id! - b.id!)
        .map(async (window, position) => ({
          id: window.id!,
          position,
          hashes: await fingerprint(window.tabs ?? []),
        })),
    )
    const boundKeys = new Set(
      Object.values(assignments).map((value) => value.key),
    )
    const restored = matchWindowIdentities(
      fingerprints.filter((window) => !assignments[window.id]),
      saved.filter((record) => !boundKeys.has(record.key)),
      new Map(
        Object.entries(previous).map(([id, value]) => [Number(id), value.key]),
      ),
    )
    const exactKeys = new Set(
      [...restored]
        .filter(([id, key]) => {
          const hashes = fingerprints.find((window) => window.id === id)!.hashes
          const record = saved.find((record) => record.key === key)!
          return (
            hashes.length === record.hashes.length &&
            countMatchingWindowHashes(hashes, record.hashes) === hashes.length
          )
        })
        .map(([, key]) => key),
    )
    const restoreAssignment = (
      current: (typeof fingerprints)[number],
      record: SavedWindowIdentity,
    ): WindowIdentityAssignment => {
      const { id, hashes } = current
      const { key } = record
      const window = windows.find((window) => window.id === id)!
      const prior = previous[id]
      const matchedFull =
        (prior?.key === key && prior.matchedFull === true) ||
        (exactKeys.has(key) &&
          !saved.some(
            (other) =>
              other.key !== key &&
              !boundKeys.has(other.key) &&
              !exactKeys.has(other.key) &&
              other.hashes.length > hashes.length &&
              countMatchingWindowHashes(hashes, other.hashes) === hashes.length,
          ))
      const confirmAfter = confirmationDeadline(prior, key, hashes, now)
      const provisional =
        now < confirmAfter ||
        !matchedFull ||
        window.tabs?.some(
          (tab) =>
            !(tab.pendingUrl || tab.url) ||
            (tab.status === 'loading' && !tab.discarded),
        ) === true
      return {
        key,
        name: record.name,
        icon: record.icon,
        iconColor: record.iconColor,
        provisional,
        position: current.position,
        ...(provisional ? { confirmAfter, hashes, matchedFull } : {}),
      }
    }
    for (const [id, key] of restored) {
      assignments[id] = restoreAssignment(
        fingerprints.find((window) => window.id === id)!,
        saved.find((record) => record.key === key)!,
      )
    }
    // Keep plausible guesses and recognized names unless another window wins them.
    const assignedKeys = new Set(
      Object.values(assignments).map((value) => value.key),
    )
    for (const window of windows) {
      const prior = previous[window.id ?? -1]
      const current = fingerprints.find((item) => item.id === window.id)
      const record = saved.find((record) => record.key === prior?.key)
      if (
        window.id !== undefined &&
        window.id !== removedId &&
        prior?.provisional &&
        !assignments[window.id] &&
        !assignedKeys.has(prior.key) &&
        current &&
        record &&
        (prior.matchedFull ||
          matchWindowIdentities([current], [record]).has(window.id))
      ) {
        assignments[window.id] = restoreAssignment(current, record)
        assignedKeys.add(prior.key)
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
        assignments[edit.windowId] = { key: '', name: '', cleared: true }
        saved = saved.filter((record) => record.key !== existing?.key)
      } else
        assignments[edit.windowId] = {
          key: existing?.key || crypto.randomUUID(),
          name,
          icon,
          iconColor: icon ? iconColor : undefined,
          position: fingerprints.find((window) => window.id === edit.windowId)
            ?.position,
        }
    }
    if (edit) {
      // Capture a consistent order together; keep it intact as Chrome closes windows.
      saved = saved.map((record) => ({ ...record, position: undefined }))
      for (const window of fingerprints) {
        const assigned = assignments[window.id]
        if (assigned) assigned.position = window.position
      }
    }
    for (const window of windows) {
      const assigned = assignments[window.id ?? -1]
      if (
        !assigned ||
        assigned.cleared ||
        assigned.provisional ||
        window.incognito
      )
        continue
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
        position: assigned.position ?? existing?.position,
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
    const deadlines = Object.values(assignments)
      .filter((value) => value.provisional && value.confirmAfter! > now)
      .map((value) => value.confirmAfter!)
    if (deadlines.length)
      await api.alarms.create(WINDOW_RESTORE_ALARM, {
        when: Math.min(...deadlines),
      })
    else await api.alarms.clear(WINDOW_RESTORE_ALARM)
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
  const changed = () => {
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
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === WINDOW_RESTORE_ALARM) changed()
  })
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
