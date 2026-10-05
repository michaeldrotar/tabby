import { useEffect, useRef, useState } from 'react'

export const useOmnibarQuery = (
  inputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const [query, setQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const hasFocusedInitialInput = useRef(false)

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
      setQuery(lastQuery)
      setIsLoaded(true)
    }

    void loadLastQuery()

    return () => {
      cancelled = true
    }
  }, [inputRef])

  useEffect(() => {
    if (!isLoaded || hasFocusedInitialInput.current) return

    hasFocusedInitialInput.current = true
    inputRef.current?.focus()
    if (query) inputRef.current?.select()
  }, [inputRef, isLoaded, query])

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
