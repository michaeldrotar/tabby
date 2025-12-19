import { useEffect, useState } from 'react'

export const useOmnibarQuery = (
  inputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const [query, setQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load last query
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get('lastQuery').then((res) => {
        if (res.lastQuery) {
          setQuery(res.lastQuery)
        }
        setIsLoaded(true)

        // Focus and select
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            if (res.lastQuery) {
              inputRef.current.select()
            }
          }
        }, 50)
      })
    } else {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [inputRef])

  useEffect(() => {
    if (isLoaded) {
      chrome.storage.local.set({ lastQuery: query })
    }
  }, [query, isLoaded])

  return { query, setQuery, isLoaded }
}
