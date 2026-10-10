import { OmnibarCancelledError } from '@extension/core/omnibar'
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
} from '@extension/core'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/Omnibar'

export type OmnibarViewState = {
  query: string
  selectedIndex: number
  modifiers: { command: boolean; shift: boolean }
  externalResults: OmnibarResult[]
  resultsQuery: string
  scrollTop: number
  edited: boolean
  error: string | null
}
export const createOmnibarView = (initial: Partial<OmnibarViewState> = {}) =>
  createStore<OmnibarViewState>(() => ({
    query: '',
    selectedIndex: 0,
    modifiers: { command: false, shift: false },
    externalResults: [],
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
  } = useTabbyResources()
  const view = views.omnibar
  const now = environment.now()
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
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  useEffect(() => {
    if (
      live &&
      metadata.loaded &&
      !view.getState().edited &&
      !view.getState().query
    )
      view.setState({ query: metadata.initialQuery })
  }, [metadata, view, live])
  useEffect(() => {
    if (!live || !state.query) return
    let cancelled = false
    const query = state.query
    const timer = setTimeout(() => {
      void resource.search(query).then(
        (externalResults) => {
          if (!cancelled)
            view.setState({ externalResults, resultsQuery: query })
        },
        () => {
          if (!cancelled)
            view.setState({ externalResults: [], resultsQuery: query })
        },
      )
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [state.query, resource, view, live])
  const execute = useCallback(
    async (action: OmnibarAction, modifier?: OmnibarModifier) => {
      const query = view.getState().query
      await resource.execute(action, modifier)
      if (view.getState().query === query)
        view.setState({
          query: '',
          edited: true,
          selectedIndex: 0,
          externalResults: [],
          resultsQuery: '',
        })
    },
    [resource, view],
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
      execute: (modifier) => execute(result.action, modifier),
    })
    return getOmnibarResults(
      state.query,
      snapshot,
      metadata.originalWindowId,
      state.resultsQuery === state.query ? state.externalResults : [],
      now,
    ).map(present)
  }, [
    resource,
    execute,
    snapshot,
    metadata.originalWindowId,
    now,
    state.query,
    state.resultsQuery,
    state.externalResults,
  ])
  const dismiss = onDismiss
  const error = (error: unknown) => {
    if (error instanceof OmnibarCancelledError) return
    view.setState({
      error: error instanceof Error ? error.message : String(error),
    })
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
        query={state.query}
        onQueryChange={(query) => {
          view.setState({ query, selectedIndex: 0, edited: true, error: null })
          void resource.saveQuery(query).catch(error)
        }}
        selectedIndex={state.selectedIndex}
        onSelectedIndexChange={(next) =>
          view.setState({
            selectedIndex:
              typeof next === 'function'
                ? next(view.getState().selectedIndex)
                : next,
          })
        }
        modifiers={state.modifiers}
        onModifiersChange={(modifiers) => view.setState({ modifiers })}
        onOpenTabManager={() => execute({ kind: 'tab-manager' })}
        onOpenOptions={() => execute({ kind: 'options' })}
        onError={error}
        scrollTop={state.scrollTop}
        onScrollChange={(scrollTop) => view.setState({ scrollTop })}
        autofocus={metadata.loaded}
      />
      {state.error && (
        <div role="alert" className="bg-card text-foreground px-4 py-2 text-sm">
          {state.error}
        </div>
      )}
    </>
  )
}
