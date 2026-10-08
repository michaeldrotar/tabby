import { useEffect, useRef, useState } from 'react'

export const useOmnibarQuery = (
  inputRef: React.RefObject<HTMLInputElement | null>,
  { focusInputOnOpen = true }: { focusInputOnOpen?: boolean } = {},
) => {
  const [query, setQueryState] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const hasFocusedInitialInput = useRef(false)
  const hasUserEditedQuery = useRef(false)

  const setQuery = (nextQuery: string) => {
    hasUserEditedQuery.current = true
    setQueryState(nextQuery)
  }

  useEffect(() => {
    let cancelled = false

    const loadLastQuery = async () => {
      let lastQuery = ''

      if (
        typeof chrome !== 'undefined' &&
        chrome.storage &&
        chrome.storage.local
      ) {
        try {
          const result = await chrome.storage.local.get('lastQuery')
          if (typeof result.lastQuery === 'string') {
            lastQuery = result.lastQuery
          }
        } catch (error) {
          console.debug('Could not load the last search query', { error })
        }
      }

      if (cancelled) return
      if (!hasUserEditedQuery.current) setQueryState(lastQuery)
      setIsLoaded(true)
    }

    void loadLastQuery()

    return () => {
      cancelled = true
    }
  }, [inputRef])

  useEffect(() => {
    if (!isLoaded || !focusInputOnOpen || hasFocusedInitialInput.current) return

    hasFocusedInitialInput.current = true
    inputRef.current?.focus()
    if (query && !hasUserEditedQuery.current) inputRef.current?.select()
  }, [focusInputOnOpen, inputRef, isLoaded, query])

  useEffect(() => {
    if (
      isLoaded &&
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      void chrome.storage.local.set({ lastQuery: query })
    }
  }, [query, isLoaded])

  return { query, setQuery, isLoaded }
}
