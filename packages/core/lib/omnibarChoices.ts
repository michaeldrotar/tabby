import type { OmnibarChoice, OmnibarResult } from './omnibar.js'

export const OMNIBAR_CHOICE_LIMIT = 200
export const OMNIBAR_CHOICE_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000
const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000

export const normalizeOmnibarQuery = (query: string) =>
  query.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')

export const getOmnibarTarget = (
  item: Pick<OmnibarResult, 'type' | 'action'>,
): string => {
  const action = item.action
  switch (action.kind) {
    case 'tab':
      return `tab:${action.tabId}`
    case 'window':
      return `window:${action.windowId}`
    case 'group':
      return `group:${action.groupId}`
    case 'restore':
      return `restore:${action.sessionId}`
    case 'url':
      return item.type === 'search'
        ? 'search:google'
        : `${item.type === 'command' ? 'command' : 'url'}:${action.url}`
    default:
      return `command:${action.kind}`
  }
}

/** Keep the chosen destination and the tabs opened from it equally recent. */
export const getOmnibarExecutionChoices = (
  choice: OmnibarChoice,
  openedTabs: readonly { id?: number; url?: string }[],
): OmnibarChoice[] => {
  if (choice.target === 'search:google') return []
  const targets = new Set([choice.target])
  for (const tab of openedTabs) {
    if (
      typeof tab.id === 'number' &&
      Number.isSafeInteger(tab.id) &&
      tab.id >= 0
    )
      targets.add(`tab:${tab.id}`)
    if (tab.url) targets.add(`url:${tab.url}`)
  }
  return [...targets].map((target) => ({ ...choice, target }))
}

export const readOmnibarChoices = (
  value: unknown,
  now: number,
): OmnibarChoice[] => {
  if (!Array.isArray(value)) return []
  const destinations = new Set<string>()
  return value
    .filter(
      (item): item is OmnibarChoice =>
        !!item &&
        typeof item === 'object' &&
        typeof item.query === 'string' &&
        item.query.length > 0 &&
        item.query.length <= 256 &&
        typeof item.target === 'string' &&
        item.target.length > 0 &&
        item.target.length <= 4096 &&
        item.target !== 'search:google' &&
        typeof item.selectedAt === 'number' &&
        Number.isFinite(item.selectedAt) &&
        item.selectedAt <= now &&
        now - item.selectedAt < OMNIBAR_CHOICE_LIFETIME_MS,
    )
    .sort((a, b) => b.selectedAt - a.selectedAt)
    .filter((item) => {
      const query = normalizeOmnibarQuery(item.query)
      const key = JSON.stringify([query, item.target])
      if (!query || destinations.has(key)) return false
      destinations.add(key)
      return true
    })
    .slice(0, OMNIBAR_CHOICE_LIMIT)
    .map((item) => ({ ...item, query: normalizeOmnibarQuery(item.query) }))
}

export const rememberOmnibarChoices = (
  choices: readonly OmnibarChoice[],
  selected: readonly OmnibarChoice[],
  now: number,
): OmnibarChoice[] =>
  readOmnibarChoices([...selected].reverse().concat(choices), now)

export const rememberOmnibarChoice = (
  choices: readonly OmnibarChoice[],
  choice: OmnibarChoice,
  now = choice.selectedAt,
): OmnibarChoice[] => rememberOmnibarChoices(choices, [choice], now)

/** Recall selections when every current word prefixes a word used to find them. */
export const matchesOmnibarChoiceQuery = (saved: string, query: string) => {
  const terms = normalizeOmnibarQuery(query).split(' ').filter(Boolean)
  const savedTerms = normalizeOmnibarQuery(saved).split(' ')
  return (
    terms.length > 0 &&
    terms.every((term) =>
      savedTerms.some((savedTerm) => savedTerm.startsWith(term)),
    )
  )
}

export const getOmnibarChoiceBonus = (
  choices: readonly OmnibarChoice[],
  query: string,
  target: string,
  now: number,
) => {
  let bonus = 0
  for (const choice of choices) {
    if (
      choice.target === target &&
      matchesOmnibarChoiceQuery(choice.query, query) &&
      choice.selectedAt <= now &&
      now - choice.selectedAt < OMNIBAR_CHOICE_LIFETIME_MS
    ) {
      bonus = Math.max(
        bonus,
        80 * 2 ** (-(now - choice.selectedAt) / HALF_LIFE_MS),
      )
    }
  }
  return bonus
}
