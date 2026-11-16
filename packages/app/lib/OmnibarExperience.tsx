import { OmnibarCancelledError } from '@extension/core/omnibar'
import { getOmnibarTarget } from '@extension/core/omnibarChoices'
import { getOmnibarResults } from '@extension/core/omnibarResults'
import { formatTimeAgo } from '@extension/core/time'
import { Omnibar } from '@extension/ui/omnibar/Omnibar'
import { useSurface } from '@extension/ui/Surface'
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { useTabbyResources } from './TabbyProvider'
import type {
  OmnibarAction,
  OmnibarModifier,
  OmnibarResult,
  OmnibarScope,
} from '@extension/core'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/Omnibar'

const resultIdentity = (result: Pick<OmnibarResult, 'type' | 'id'>) =>
  `${result.type}:${result.id}`

export type OmnibarViewState = {
  query: string
  scope: OmnibarScope
  initialized: boolean
  selectedIndex: number
  selectedTarget: string | null
  modifiers: { command: boolean; shift: boolean }
  externalResults: OmnibarResult[]
  resultsScope: OmnibarScope
  resultsQuery: string
  scrollTop: number
  edited: boolean
  error: string | null
}
export const createOmnibarView = (initial: Partial<OmnibarViewState> = {}) =>
  createStore<OmnibarViewState>(() => ({
    query: '',
    scope: 'all',
    initialized: false,
    selectedIndex: 0,
    selectedTarget: null,
    modifiers: { command: false, shift: false },
    externalResults: [],
    resultsScope: 'all',
    resultsQuery: '',
    scrollTop: 0,
    edited: false,
    error: null,
    ...initial,
  }))
export type OmnibarView = ReturnType<typeof createOmnibarView>
export const OmnibarExperience = ({
  onDismiss,
  className,
  hideTabManagerAction = false,
}: {
  onDismiss: () => void
  className?: string
  hideTabManagerAction?: boolean
}) => {
  const {
    omnibar: resource,
    backend: browser,
    views,
    environment,
    preferences,
  } = useTabbyResources()
  const preferenceState = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
    preferences.getSnapshot,
  )
  const view = views.omnibar
  const metadata = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  const snapshot = useSyncExternalStore(
    browser.subscribe,
    browser.getSnapshot,
    browser.getSnapshot,
  )
  const state = useStore(view)
  const searchQuery = state.query
  const scope = state.scope
  const ranking = useMemo(
    () => ({ query: searchQuery, now: environment.now() }),
    [searchQuery, environment],
  )
  const now = ranking.now
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  useEffect(() => {
    if (
      live &&
      metadata.loaded &&
      !view.getState().edited &&
      !view.getState().initialized
    ) {
      view.setState({
        query: metadata.initialQuery,
        scope: metadata.initialScope ?? 'all',
        initialized: true,
      })
      if (metadata.initialQuery.trim())
        void resource
          .saveQuery(metadata.initialQuery, metadata.initialScope ?? 'all')
          .catch((error) => {
            view.setState({
              error: error instanceof Error ? error.message : String(error),
            })
          })
    }
  }, [metadata, view, live, resource])
  useEffect(() => {
    if (
      !live ||
      (!searchQuery.trim() && scope === 'all') ||
      !['all', 'bookmarks', 'history', 'recently-closed'].includes(scope)
    )
      return
    let cancelled = false
    const query = searchQuery
    const search = async () => {
      try {
        const externalResults = await resource.search(searchQuery, scope)
        if (!cancelled)
          view.setState({
            externalResults,
            resultsQuery: query,
            resultsScope: scope,
          })
      } catch {
        if (!cancelled)
          view.setState({
            externalResults: [],
            resultsQuery: query,
            resultsScope: scope,
          })
      }
    }
    const timer = setTimeout(() => void search(), searchQuery.trim() ? 200 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery, scope, resource, view, live])
  const execute = useCallback(
    async (
      action: OmnibarAction,
      modifier?: OmnibarModifier,
      result?: OmnibarResult,
    ) => {
      const { query, scope } = view.getState()
      await resource.execute(
        action,
        modifier,
        result && query.trim()
          ? {
              query,
              target: getOmnibarTarget(result),
              selectedAt: environment.now(),
            }
          : undefined,
      )
      if (view.getState().query === query && view.getState().scope === scope)
        view.setState({
          query: '',
          scope: 'all',
          edited: true,
          selectedIndex: 0,
          selectedTarget: null,
          externalResults: [],
          resultsQuery: '',
        })
    },
    [resource, view, environment],
  )
  const results = useMemo(() => {
    const present = (result: OmnibarResult): OmnibarSearchResult => ({
      ...result,
      favIconUrl:
        result.favIconUrl ??
        (result.url ? resource.getFaviconUrl?.(result.url) : undefined),
      ageLabel:
        result.lastVisitTime === undefined
          ? undefined
          : formatTimeAgo(result.lastVisitTime, now),
      execute: (modifier) => execute(result.action, modifier, result),
    })
    return getOmnibarResults(
      searchQuery,
      snapshot,
      metadata.originalWindowId,
      state.resultsQuery === searchQuery && state.resultsScope === scope
        ? state.externalResults
        : [],
      now,
      preferenceState.tabManagerCompactIconMode,
      metadata.choices,
      scope,
    ).map(present)
  }, [
    resource,
    preferenceState.tabManagerCompactIconMode,
    execute,
    snapshot,
    metadata.originalWindowId,
    metadata.choices,
    now,
    scope,
    searchQuery,
    state.resultsQuery,
    state.resultsScope,
    state.externalResults,
  ])
  const retainedIndex =
    state.selectedTarget === null
      ? -1
      : results.findIndex(
          (result) => resultIdentity(result) === state.selectedTarget,
        )
  const selectedIndex = retainedIndex >= 0 ? retainedIndex : state.selectedIndex
  const dismiss = onDismiss
  const error = (error: unknown) => {
    if (error instanceof OmnibarCancelledError) return
    view.setState({
      error: error instanceof Error ? error.message : String(error),
    })
  }
  const changeCriteria = (query: string, scope: OmnibarScope) => {
    view.setState({
      query,
      scope,
      scrollTop: 0,
      selectedIndex: 0,
      selectedTarget: null,
      edited: true,
      error: null,
    })
    void resource.saveQuery(query, scope).catch(error)
  }
  return (
    <>
      <Omnibar
        results={results}
        className={className}
        onDismiss={dismiss}
        hideTabManagerAction={hideTabManagerAction}
        isMac={metadata.isMac}
        originalWindowId={metadata.originalWindowId}
        openTabManagerShortcut={metadata.openTabManagerShortcut}
        scope={scope}
        onScopeChange={(scope) => changeCriteria(view.getState().query, scope)}
        query={state.query}
        onQueryChange={(query) => changeCriteria(query, view.getState().scope)}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={(next) => {
          const index = typeof next === 'function' ? next(selectedIndex) : next
          view.setState({
            selectedIndex: index,
            selectedTarget: results[index]
              ? resultIdentity(results[index])
              : null,
          })
        }}
        modifiers={state.modifiers}
        onModifiersChange={(modifiers) => view.setState({ modifiers })}
        onOpenTabManager={() => execute({ kind: 'tab-manager' })}
        onOpenOptions={() => execute({ kind: 'options' })}
        onError={error}
        scrollTop={state.scrollTop}
        onScrollChange={(scrollTop) => view.setState({ scrollTop })}
        autofocus={metadata.loaded && (state.initialized || state.edited)}
      />
      {state.error && (
        <div role="alert" className="bg-card px-4 py-2 text-sm text-foreground">
          {state.error}
        </div>
      )}
    </>
  )
}
