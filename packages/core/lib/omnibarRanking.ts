import {
  getOmnibarChoiceBonus,
  getOmnibarTarget,
  normalizeOmnibarQuery,
  readOmnibarChoices,
} from './omnibarChoices.js'
import type { OmnibarChoice, OmnibarResult } from './omnibar.js'

export type OmnibarRankableResult = Pick<
  OmnibarResult,
  | 'id'
  | 'type'
  | 'title'
  | 'searchTitle'
  | 'searchAliases'
  | 'url'
  | 'lastVisitTime'
> &
  Partial<Pick<OmnibarResult, 'action'>>

const BASE_WEIGHTS: Partial<Record<OmnibarResult['type'], number>> = {
  command: 6,
  window: 5,
  'tab-group': 4,
  tab: 3,
  bookmark: 2,
  'recently-closed': 1,
  history: 0,
}

const RECENCY_HALF_LIFE_MS = 24 * 60 * 60 * 1000

const tokenize = (text: string): string[] =>
  normalizeOmnibarQuery(text)
    .split(/[\s\-_./:?#[\]@!$&'()*+,;=%]+/)
    .filter(Boolean)

const getUrlTokens = (url: string) => {
  const hierarchical = /^[a-z][a-z\d+.-]*:\/\//i.test(url)
  const opaque = !hierarchical && /^[a-z][a-z\d+.-]*:/i.test(url)
  const withoutScheme = url.replace(/^[a-z][a-z\d+.-]*:(?:\/\/)?/i, '')
  const address = withoutScheme.split(/[?#]/)[0] ?? ''
  const suffix = withoutScheme.slice(address.length)
  const [hostPart = '', ...pathParts] = address.split('/')
  return {
    host: opaque
      ? []
      : tokenize(hostPart.replace(/^.*@/, '').replace(/:\d+$/, '')),
    path: tokenize(opaque ? withoutScheme : pathParts.join('/') + suffix),
  }
}

/** Text relevance orders candidates without changing provider eligibility. */
export const getOmnibarMatchScore = (
  item: OmnibarRankableResult,
  query: string,
): number => {
  const normalized = normalizeOmnibarQuery(query)
  if (!normalized || item.type === 'search') return 0
  const terms = [
    ...new Set(tokenize(normalized.replace(/^[a-z][a-z\d+.-]*:\/\//i, ''))),
  ]
  if (!terms.length) return 0
  const title = normalizeOmnibarQuery(item.searchTitle ?? item.title)
  const titleTokens = tokenize(title)
  const aliases = (item.searchAliases ?? []).flatMap(tokenize)
  const { host, path } = getUrlTokens(item.url ?? '')
  let score = 0
  for (const term of terms) {
    if (titleTokens.includes(term)) score += 40
    else if (titleTokens.some((token) => token.startsWith(term))) score += 32
    else if (aliases.includes(term) || host.includes(term)) score += 24
    else if (
      aliases.some((token) => token.startsWith(term)) ||
      host.some((token) => token.startsWith(term))
    )
      score += 20
    else if (path.includes(term)) score += 12
    else if (path.some((token) => token.startsWith(term))) score += 10
    else if (
      title.includes(term) ||
      host.some((token) => token.includes(term)) ||
      path.some((token) => token.includes(term))
    )
      score += 4
  }
  const phrase = terms.join(' ')
  const titlePhrase = titleTokens.join(' ')
  if (titlePhrase === phrase) return 60
  if (titlePhrase.startsWith(phrase)) return Math.max(48, score / terms.length)
  return score / terms.length
}

export const calculateScore = (
  item: OmnibarRankableResult,
  query: string,
  now: number,
  choices: readonly OmnibarChoice[] = [],
): number => {
  const match = getOmnibarMatchScore(item, query)
  const bonus = item.action
    ? getOmnibarChoiceBonus(
        choices,
        query,
        getOmnibarTarget({ type: item.type, action: item.action }),
        now,
      )
    : 0
  const recency =
    typeof item.lastVisitTime === 'number' &&
    Number.isFinite(item.lastVisitTime)
      ? 20 *
        2 ** (-Math.max(0, now - item.lastVisitTime) / RECENCY_HALF_LIFE_MS)
      : 0
  return (BASE_WEIGHTS[item.type] ?? 0) + match + bonus + recency
}

export const rankOmnibarResults = <T extends OmnibarRankableResult>(
  items: readonly T[],
  query: string,
  now: number,
  choices: readonly OmnibarChoice[] = [],
): T[] => {
  const normalized = normalizeOmnibarQuery(query)
  const choiceOrder = new Map(
    readOmnibarChoices(choices, now)
      .filter((choice) => choice.query === normalized)
      .map((choice, index) => [choice.target, index]),
  )
  return items
    .map((item) => ({
      item,
      score: calculateScore(item, query, now, choices),
      choiceOrder: item.action
        ? choiceOrder.get(
            getOmnibarTarget({ type: item.type, action: item.action }),
          )
        : undefined,
    }))
    .filter(({ score }) => Number.isFinite(score))
    .sort(compareOmnibarScoredItems)
    .map(({ item }) => item)
}

export type OmnibarScoredItem = {
  item: OmnibarRankableResult
  score: number
  choiceOrder?: number
}

export const compareOmnibarScoredItems = (
  a: OmnibarScoredItem,
  b: OmnibarScoredItem,
): number =>
  b.score - a.score ||
  (a.choiceOrder ?? Number.MAX_SAFE_INTEGER) -
    (b.choiceOrder ?? Number.MAX_SAFE_INTEGER) ||
  a.item.title.localeCompare(b.item.title) ||
  String(a.item.id).localeCompare(String(b.item.id))
