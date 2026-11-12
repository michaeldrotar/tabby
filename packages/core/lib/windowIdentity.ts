import type {
  BrowserSnapshot,
  BrowserTabGroupColor,
  BrowserWindow,
} from './browser.js'

export const WINDOW_ICONS = [
  'window',
  'briefcase',
  'code',
  'book',
  'flask',
  'palette',
  'music',
  'coffee',
  'heart',
  'globe',
] as const

export const getWindowIdentity = (
  window: BrowserWindow,
  tabs: BrowserSnapshot['tabs'],
  source: 'active' | 'first' = 'active',
) => {
  const members = tabs
    .filter((tab) => tab.windowId === window.id)
    .sort((a, b) => a.index - b.index)
  const active =
    (source === 'active' ? members.find((tab) => tab.active) : undefined) ??
    members[0]
  return {
    title:
      window.name?.trim() ||
      active?.title ||
      (window.incognito ? 'Private window' : `Window ${window.id}`),
    icon: window.icon,
    iconColor: window.iconColor,
    iconUrl: window.icon ? undefined : active?.faviconUrl,
  }
}

export type WindowFingerprint = {
  id: number
  hashes: readonly string[]
  position?: number
}
export type SavedWindowIdentity = {
  key: string
  name: string
  icon?: string
  iconColor?: BrowserTabGroupColor
  hashes: string[]
  updatedAt: number
  position?: number
}

export const countMatchingWindowHashes = (
  a: readonly string[],
  b: readonly string[],
) => {
  const remaining = [...b]
  let shared = 0
  for (const hash of a) {
    const index = remaining.indexOf(hash)
    if (index >= 0) {
      shared++
      remaining.splice(index, 1)
    }
  }
  return shared
}

const similarity = (a: readonly string[], b: readonly string[]) => {
  if (!a.length || !b.length) return 0
  const shared = countMatchingWindowHashes(a, b)
  const coverage = shared / a.length
  const completeness = shared / Math.max(a.length, b.length)
  return completeness === 1 || (shared >= 2 && coverage >= 0.8)
    ? coverage * 0.3 + completeness * 0.7
    : 0
}

/** Order and incumbency support content matches, but cannot identify a window alone. */
export const matchWindowIdentities = (
  windows: readonly WindowFingerprint[],
  saved: readonly SavedWindowIdentity[],
  previous: ReadonlyMap<number, string> = new Map(),
): Map<number, string> => {
  const matches = new Map<number, string>()
  let candidates = windows
    .flatMap((window) =>
      saved.flatMap((record) => {
        const content = similarity(window.hashes, record.hashes)
        if (!content) return []
        const order =
          window.position !== undefined && record.position !== undefined
            ? 0.2 / (1 + Math.abs(window.position - record.position) * 4)
            : 0
        return [
          {
            id: window.id,
            key: record.key,
            score:
              content +
              // An exact fingerprint outweighs order and an earlier partial guess.
              (content === 1 ? 0.5 : 0) +
              order +
              (previous.get(window.id) === record.key ? 0.12 : 0),
          },
        ]
      }),
    )
    .sort((a, b) => b.score - a.score)
  while (candidates.length) {
    const byWindow = new Map<number, typeof candidates>()
    const byKey = new Map<string, typeof candidates>()
    for (const candidate of candidates) {
      const window = byWindow.get(candidate.id) ?? []
      const record = byKey.get(candidate.key) ?? []
      if (window.length < 2) window.push(candidate)
      if (record.length < 2) record.push(candidate)
      byWindow.set(candidate.id, window)
      byKey.set(candidate.key, record)
    }
    const best = candidates.find(
      (candidate) =>
        ![...byWindow.get(candidate.id)!, ...byKey.get(candidate.key)!].some(
          (other) =>
            other !== candidate &&
            (other.id === candidate.id || other.key === candidate.key) &&
            candidate.score - other.score < 0.1,
        ),
    )
    if (!best) break
    matches.set(best.id, best.key)
    candidates = candidates.filter(
      (candidate) => candidate.id !== best.id && candidate.key !== best.key,
    )
  }
  return matches
}
