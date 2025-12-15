import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { useOmnibarFiltering } from './useOmnibarFiltering'
import { Kbd } from '../Kbd'
import { ScrollArea } from '../ScrollArea'
import { cn } from '../utils/cn'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'
import type { Dispatch, SetStateAction } from 'react'

export type OmnibarDemoProps = {
  className?: string
  scenarioId?: OmnibarDemoScenarioId
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export type OmnibarDemoScenarioId =
  | 'search-everything'
  | 'find-open-tab'
  | 'recover-recently-closed'
  | 'multi-term-matching'
  | 'url-vs-search'
  | 'open-in-new-tab-window'
  | 'built-in-commands'

export type OmnibarDemoScenarioMeta = {
  id: OmnibarDemoScenarioId
  title: string
  description: string
  bullets: [string, string]
}

export const omnibarDemoScenarios: OmnibarDemoScenarioMeta[] = [
  {
    id: 'search-everything',
    title: 'Search everything',
    description:
      'Tabs, bookmarks, history, and recently closed — without switching tools.',
    bullets: ['Reduce cognitive overload', 'Stay in flow with keyboard search'],
  },
  {
    id: 'find-open-tab',
    title: 'Jump to an open tab',
    description: 'Find the tab you already have open in seconds.',
    bullets: ['No hunting through windows', 'Switch context instantly'],
  },
  {
    id: 'recover-recently-closed',
    title: 'Recover a closed tab',
    description:
      'Find something you closed 10 tabs ago — and open it directly.',
    bullets: ['No “restore everything” required', 'Open it right from search'],
  },
  {
    id: 'multi-term-matching',
    title: 'Multi-term matching',
    description: 'Be vague. Tabby still finds it.',
    bullets: ['Search like you think', 'Matches across title and URL'],
  },
  {
    id: 'url-vs-search',
    title: 'URL vs Search',
    description: 'Type anything — Tabby suggests both “open” and “search”.',
    bullets: ['Fewer steps to open', 'Works with partial URLs'],
  },
  {
    id: 'open-in-new-tab-window',
    title: 'Open in a new tab or window',
    description:
      'Keep your current tab intact, or pop a result into a new window.',
    bullets: ['Open in a new tab', 'Open in a new window'],
  },
  {
    id: 'built-in-commands',
    title: 'Built-in commands',
    description:
      'No more hunting through menus to find your passwords or extensions.',
    bullets: [
      'Jump straight to Chrome pages',
      'Find tools with a few keystrokes',
    ],
  },
]

const getQueryTerms = (query: string) =>
  query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

const matchesAllTerms = (query: string, item: OmnibarSearchResult) => {
  const terms = getQueryTerms(query)
  if (terms.length === 0) return true
  const haystack = `${item.title ?? ''} ${item.url ?? ''}`.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

const prefilterExternalResultsForDemo = (
  query: string,
  externalResults: OmnibarSearchResult[],
) =>
  externalResults.filter((item) => {
    if (
      item.type !== 'history' &&
      item.type !== 'bookmark' &&
      item.type !== 'recently-closed'
    )
      return true
    return matchesAllTerms(query, item)
  })

type DemoFixtures = {
  tabs: OmnibarSearchResult[]
  externalResults: OmnibarSearchResult[]
}

type DemoControls = {
  setQuery: Dispatch<SetStateAction<string>>
  setSelectedIndex: Dispatch<SetStateAction<number>>
  flashKey: (key: string, ms?: number) => Promise<void>
  sleep: (ms: number) => Promise<void>
  getFilteredItems: () => OmnibarSearchResult[]
  getSelectedIndex: () => number
  setIsShiftPressed: (next: boolean) => void
  setIsCmdCtrlPressed: (next: boolean) => void
  os: 'mac' | 'windows' | 'android' | 'cros' | 'linux' | 'openbsd' | undefined
}

type DemoScenario = DemoFixtures & {
  id: OmnibarDemoScenarioId
  runOnce: (controls: DemoControls) => Promise<void>
}

const now = () => Date.now()

const noop = async () => {}

const getCmdCtrlLabel = (os: DemoControls['os']) =>
  os === 'mac' ? '⌘' : 'Ctrl'

const makeSearchEverythingScenario = (): DemoScenario => {
  const n = now()
  return {
    id: 'search-everything',
    tabs: [
      {
        id: 'tab-1',
        type: 'tab',
        title: 'Tabby News — “I have too many tabs”',
        url: 'chrome-extension://__EXTENSION_ID__/options/index.html',
        lastVisitTime: n - 1000 * 60 * 8,
        execute: noop,
      },
      {
        id: 'tab-2',
        type: 'tab',
        title: 'Tabby News — “I can’t find anything”',
        url: 'https://tabby.example/news/cant-find-anything',
        lastVisitTime: n - 1000 * 60 * 40,
        execute: noop,
      },
    ],
    externalResults: [
      {
        id: 'bookmark-1',
        type: 'bookmark',
        title: 'Tabby News — “I want to move faster without switching tools”',
        url: 'https://tabby.example/news/move-faster',
        lastVisitTime: n - 1000 * 60 * 60 * 24,
        execute: noop,
      },
      {
        id: 'closed-1',
        type: 'recently-closed',
        title: 'Tabby News — Less context switching, less cognitive overload',
        url: 'https://tabby.example/news/cognitive-overload',
        lastVisitTime: n - 1000 * 60 * 60 * 18,
        execute: noop,
      },
      {
        id: 'history-1',
        type: 'history',
        title: 'Tabby News — “I miss Arc but won’t switch browsers”',
        url: 'https://tabby.example/news/miss-arc',
        lastVisitTime: n - 1000 * 60 * 60 * 2,
        execute: noop,
      },
      {
        id: 'history-2',
        type: 'history',
        title: 'Tabby News — “Chrome feels slow and chaotic”',
        url: 'https://tabby.example/news/slow-and-chaotic',
        lastVisitTime: n - 1000 * 60 * 120,
        execute: noop,
      },
    ],
    runOnce: async ({
      setQuery,
      setSelectedIndex,
      flashKey,
      sleep,
      getFilteredItems,
      getSelectedIndex,
    }) => {
      setQuery('')
      setSelectedIndex(0)
      await sleep(1400)

      const query = 'tabby news'
      for (const ch of query) {
        setQuery((prev) => prev + ch)
        await flashKey(ch === ' ' ? 'Space' : ch.toUpperCase(), 120)
        await sleep(80)
      }

      await sleep(450)
      let safety = 0
      while (safety++ < 40) {
        const items = getFilteredItems()
        const index = getSelectedIndex()
        if (items.length === 0) break
        if (items[index] === items[items.length - 1]) break
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
        await flashKey('↓', 220)
        await sleep(200)
      }
      await sleep(1600)
    },
  }
}

const makeFindOpenTabScenario = (): DemoScenario => {
  const n = now()
  const query = 'tabby design'

  const externalResults = prefilterExternalResultsForDemo(query, [])

  return {
    id: 'find-open-tab',
    tabs: [
      {
        id: 'tab-1',
        type: 'tab',
        title: 'Tabby — Tab Manager',
        url: 'chrome-extension://__EXTENSION_ID__/tab-manager/index.html',
        lastVisitTime: n - 1000 * 60 * 2,
        execute: noop,
      },
      {
        id: 'tab-2',
        type: 'tab',
        title: 'Tabby Design Doc — Omnibar UX',
        url: 'https://tabby.example/docs/omnibar-ux',
        lastVisitTime: n - 1000 * 60 * 25,
        execute: noop,
      },
      {
        id: 'tab-3',
        type: 'tab',
        title: 'Jira — TABBY-142: Keyboard navigation polish',
        url: 'https://tabby.example/jira/TABBY-142',
        lastVisitTime: n - 1000 * 60 * 50,
        execute: noop,
      },
    ],
    externalResults,
    runOnce: async ({
      setQuery,
      setSelectedIndex,
      flashKey,
      sleep,
      getFilteredItems,
    }) => {
      setQuery('')
      setSelectedIndex(0)
      await sleep(1200)

      for (const ch of query) {
        setQuery((prev) => prev + ch)
        await flashKey(ch === ' ' ? 'Space' : ch.toUpperCase(), 120)
        await sleep(70)
      }

      await sleep(500)
      const items = getFilteredItems()
      const targetIndex = items.findIndex((i) => i.type === 'tab')
      if (targetIndex > 0) {
        for (let i = 0; i < Math.min(2, targetIndex); i++) {
          setSelectedIndex((prev) => prev + 1)
          await flashKey('↓', 220)
          await sleep(240)
        }
      }
      await sleep(1800)
    },
  }
}

const makeRecoverRecentlyClosedScenario = (): DemoScenario => {
  const n = now()
  const query = 'pricing'

  const externalResults = prefilterExternalResultsForDemo(query, [
    {
      id: 'closed-1',
      type: 'recently-closed',
      title: 'Pricing — tabby.example',
      url: 'https://tabby.example/pricing',
      lastVisitTime: n - 1000 * 60 * 3,
      execute: noop,
    },
    {
      id: 'history-1',
      type: 'history',
      title: 'Docs — Getting Started',
      url: 'https://tabby.example/docs/getting-started',
      lastVisitTime: n - 1000 * 60 * 45,
      execute: noop,
    },
  ])

  return {
    id: 'recover-recently-closed',
    tabs: [
      {
        id: 'tab-1',
        type: 'tab',
        title: 'Tabby — Features',
        url: 'chrome-extension://__EXTENSION_ID__/features/index.html',
        lastVisitTime: n - 1000 * 60 * 5,
        execute: noop,
      },
    ],
    externalResults,
    runOnce: async ({
      setQuery,
      setSelectedIndex,
      flashKey,
      sleep,
      getFilteredItems,
      getSelectedIndex,
    }) => {
      setQuery('')
      setSelectedIndex(0)
      await sleep(1200)

      for (const ch of query) {
        setQuery((prev) => prev + ch)
        await flashKey(ch.toUpperCase(), 120)
        await sleep(70)
      }

      await sleep(450)
      let steps = 0
      while (steps++ < 16) {
        const items = getFilteredItems()
        const index = getSelectedIndex()
        if (items[index]?.type === 'recently-closed') break
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
        await flashKey('↓', 220)
        await sleep(240)
      }
      await sleep(1800)
    },
  }
}

const makeMultiTermScenario = (): DemoScenario => {
  const n = now()
  const query = 'notes chaotic'

  return {
    id: 'multi-term-matching',
    tabs: [
      {
        id: 'tab-1',
        type: 'tab',
        title: 'Chrome feels slow and chaotic',
        url: 'https://tabby.example/notes/chrome-slow',
        lastVisitTime: n - 1000 * 60 * 20,
        execute: noop,
      },
      {
        id: 'tab-2',
        type: 'tab',
        title: 'Tabby: reduce cognitive overload',
        url: 'https://tabby.example/news/cognitive-overload',
        lastVisitTime: n - 1000 * 60 * 80,
        execute: noop,
      },
    ],
    externalResults: prefilterExternalResultsForDemo(query, []),
    runOnce: async ({ setQuery, setSelectedIndex, flashKey, sleep }) => {
      setQuery('')
      setSelectedIndex(0)
      await sleep(1200)

      for (const ch of query) {
        setQuery((prev) => prev + ch)
        await flashKey(ch === ' ' ? 'Space' : ch.toUpperCase(), 120)
        if (ch === ' ') await sleep(420)
        else await sleep(80)
      }
      await sleep(2200)
    },
  }
}

const makeUrlVsSearchScenario = (): DemoScenario => {
  const query = 'google.com'
  return {
    id: 'url-vs-search',
    tabs: [],
    externalResults: prefilterExternalResultsForDemo(query, []),
    runOnce: async ({ setQuery, setSelectedIndex, flashKey, sleep }) => {
      setQuery('')
      setSelectedIndex(0)
      await sleep(1200)

      for (const ch of query) {
        setQuery((prev) => prev + ch)
        await flashKey(ch.toUpperCase(), 120)
        await sleep(70)
      }

      await sleep(600)
      setSelectedIndex(1)
      await flashKey('↓', 220)
      await sleep(1200)
    },
  }
}

const makeOpenInNewTabWindowScenario = (): DemoScenario => {
  const n = now()
  const query = 'tabby news'

  const externalResults = prefilterExternalResultsForDemo(query, [
    {
      id: 'bookmark-1',
      type: 'bookmark',
      title: 'Tabby News — Move faster without switching tools',
      url: 'https://tabby.example/news/move-faster',
      lastVisitTime: n - 1000 * 60 * 60 * 24,
      execute: noop,
    },
    {
      id: 'history-1',
      type: 'history',
      title: 'Tabby News — Less cognitive overload',
      url: 'https://tabby.example/news/cognitive-overload',
      lastVisitTime: n - 1000 * 60 * 30,
      execute: noop,
    },
  ])

  return {
    id: 'open-in-new-tab-window',
    tabs: [
      {
        id: 'tab-1',
        type: 'tab',
        title: 'Tabby News — “I can’t find anything”',
        url: 'https://tabby.example/news/cant-find-anything',
        lastVisitTime: n - 1000 * 60 * 12,
        execute: noop,
      },
    ],
    externalResults,
    runOnce: async ({
      setQuery,
      setSelectedIndex,
      flashKey,
      sleep,
      getFilteredItems,
      getSelectedIndex,
      setIsCmdCtrlPressed,
      setIsShiftPressed,
      os,
    }) => {
      setQuery('')
      setSelectedIndex(0)
      setIsCmdCtrlPressed(false)
      setIsShiftPressed(false)
      await sleep(1200)

      for (const ch of query) {
        setQuery((prev) => prev + ch)
        await flashKey(ch === ' ' ? 'Space' : ch.toUpperCase(), 120)
        await sleep(70)
      }

      await sleep(550)

      // Move to a bookmark/search/url result (something that supports modifiers)
      let steps = 0
      while (steps++ < 16) {
        const items = getFilteredItems()
        const index = getSelectedIndex()
        const t = items[index]?.type
        if (
          t === 'bookmark' ||
          t === 'history' ||
          t === 'url' ||
          t === 'search'
        )
          break
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
        await flashKey('↓', 220)
        await sleep(220)
      }

      // Show “open in new tab”
      setIsCmdCtrlPressed(true)
      await flashKey(getCmdCtrlLabel(os), 1000)
      await sleep(350)
      setIsCmdCtrlPressed(false)
      await sleep(700)

      // Show “open in new window”
      setIsShiftPressed(true)
      await flashKey('Shift', 1000)
      await sleep(350)
      setIsShiftPressed(false)
      await sleep(900)
    },
  }
}

const makeBuiltInCommandsScenario = (): DemoScenario => {
  const queryA = 'password'
  const queryB = 'extensions'

  return {
    id: 'built-in-commands',
    tabs: [],
    externalResults: [],
    runOnce: async ({ setQuery, setSelectedIndex, flashKey, sleep }) => {
      setQuery('')
      setSelectedIndex(0)
      await sleep(1200)

      for (const ch of queryA) {
        setQuery((prev) => prev + ch)
        await flashKey(ch.toUpperCase(), 120)
        await sleep(70)
      }

      await sleep(650)
      setSelectedIndex(1)
      await flashKey('↓', 240)
      await sleep(1400)

      // Clear and show another command.
      setQuery('')
      setSelectedIndex(0)
      await sleep(650)

      for (const ch of queryB) {
        setQuery((prev) => prev + ch)
        await flashKey(ch.toUpperCase(), 120)
        await sleep(70)
      }

      await sleep(650)
      setSelectedIndex(1)
      await flashKey('↓', 240)
      await sleep(1400)
    },
  }
}

const getScenario = (scenarioId: OmnibarDemoScenarioId): DemoScenario => {
  switch (scenarioId) {
    case 'find-open-tab':
      return makeFindOpenTabScenario()
    case 'recover-recently-closed':
      return makeRecoverRecentlyClosedScenario()
    case 'multi-term-matching':
      return makeMultiTermScenario()
    case 'url-vs-search':
      return makeUrlVsSearchScenario()
    case 'open-in-new-tab-window':
      return makeOpenInNewTabWindowScenario()
    case 'built-in-commands':
      return makeBuiltInCommandsScenario()
    case 'search-everything':
    default:
      return makeSearchEverythingScenario()
  }
}

export const OmnibarDemo = ({ className, scenarioId }: OmnibarDemoProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeKey, setActiveKey] = useState<string>('…')
  const [isKeyActive, setIsKeyActive] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isCmdCtrlPressed, setIsCmdCtrlPressed] = useState(false)

  const os = useMemo(() => {
    if (typeof navigator === 'undefined') return undefined
    const platform = navigator.platform?.toLowerCase() ?? ''
    if (platform.includes('mac')) return 'mac'
    if (platform.includes('win')) return 'windows'
    if (platform.includes('linux')) return 'linux'
    return undefined
  }, [])

  const resolvedScenarioId: OmnibarDemoScenarioId =
    scenarioId ?? 'search-everything'
  const scenario = useMemo(
    () => getScenario(resolvedScenarioId),
    [resolvedScenarioId],
  )

  const tabs = useMemo(() => scenario.tabs, [scenario.tabs])
  const externalResults = useMemo(
    () => scenario.externalResults,
    [scenario.externalResults],
  )

  const { filteredItems, selectedIndex, setSelectedIndex } =
    useOmnibarFiltering(query, tabs, externalResults)

  const filteredItemsRef = useRef<OmnibarSearchResult[]>([])
  useEffect(() => {
    filteredItemsRef.current = filteredItems
  }, [filteredItems])

  const selectedIndexRef = useRef(0)
  useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  useEffect(() => {
    let cancelled = false

    const flashKey = async (key: string, ms = 100) => {
      if (cancelled) return
      setActiveKey(key)
      setIsKeyActive(true)
      await sleep(ms)
      if (cancelled) return
      setIsKeyActive(false)
    }

    const run = async () => {
      while (!cancelled) {
        await scenario.runOnce({
          setQuery,
          setSelectedIndex,
          flashKey,
          sleep,
          getFilteredItems: () => filteredItemsRef.current,
          getSelectedIndex: () => selectedIndexRef.current,
          setIsShiftPressed,
          setIsCmdCtrlPressed,
          os,
        })
        await sleep(2200)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // Intentionally *not* depending on filteredItems to keep the loop stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [os, resolvedScenarioId, scenario])

  return (
    <div
      className={cn(
        'bg-card text-card-foreground pointer-events-none relative flex h-full select-none flex-col',
        '[&_button]:focus:outline-none [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-0 [&_button]:focus-visible:ring-offset-0',
        className,
      )}
      aria-label="Omnibar demo"
    >
      <OmnibarInput
        ref={inputRef}
        query={query}
        disabled
        onChange={() => {
          // demo is non-interactive
        }}
        onKeyDown={() => {
          // demo is non-interactive
        }}
      />

      <ScrollArea orientation="vertical" className="flex-1">
        {filteredItems.length > 0 && (
          <ul className="py-2">
            {filteredItems.map((item, index) => (
              <OmnibarItem
                key={item.id}
                item={item}
                isSelected={index === selectedIndex}
                tabIndex={-1}
                disableScrollIntoView
                onSelect={() => {
                  // demo is non-interactive
                }}
                onMouseMove={() => {
                  // demo is non-interactive
                }}
                isShiftPressed={isShiftPressed}
                isCmdCtrlPressed={isCmdCtrlPressed}
                query={query}
              />
            ))}
          </ul>
        )}

        <OmnibarEmptyState
          query={query}
          hasResults={filteredItems.length > 0}
          quickActions={[]}
        />
      </ScrollArea>
      <div
        className={cn('absolute bottom-3 left-1/2 z-50 -translate-x-1/2')}
        aria-hidden
      >
        <Kbd
          className={cn(
            'border-border bg-background text-foreground',
            'h-10 min-w-10 px-3 py-2 text-sm transition-[transform,opacity,visibility]',
            isKeyActive
              ? 'visible scale-100 opacity-100 duration-75'
              : 'invisible scale-50 opacity-80 duration-500',
          )}
        >
          {activeKey}
        </Kbd>
      </div>
    </div>
  )
}
