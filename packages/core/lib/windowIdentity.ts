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

export type WindowFingerprint = { id: number; hashes: readonly string[] }
export type SavedWindowIdentity = {
  key: string
  name: string
  icon?: string
  iconColor?: BrowserTabGroupColor
  hashes: string[]
  updatedAt: number
}

const similarity = (a: readonly string[], b: readonly string[]) => {
  if (!a.length || !b.length) return 0
  const remaining = [...b]
  let shared = 0
  for (const hash of a) {
    const index = remaining.indexOf(hash)
    if (index >= 0) {
      shared++
      remaining.splice(index, 1)
    }
  }
  const score = shared / Math.max(a.length, b.length)
  return score === 1 || (shared >= 2 && score >= 0.8) ? score : 0
}

/** Require an unambiguous match in both directions; window order alone is not identity. */
export const matchWindowIdentities = (
  windows: readonly WindowFingerprint[],
  saved: readonly SavedWindowIdentity[],
): Map<number, string> => {
  const matches = new Map<number, string>()
  for (const window of windows) {
    const ranked = saved
      .map((record) => ({
        record,
        score: similarity(window.hashes, record.hashes),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
    const best = ranked[0]
    if (!best || (ranked[1] && best.score - ranked[1].score < 0.15)) continue
    const competing = windows
      .filter((candidate) => candidate.id !== window.id)
      .some(
        (candidate) =>
          similarity(candidate.hashes, best.record.hashes) >= best.score - 0.15,
      )
    if (!competing) matches.set(window.id, best.record.key)
  }
  return matches
}
