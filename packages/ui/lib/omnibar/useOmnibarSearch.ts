import { useEffect, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const useOmnibarSearch = (
  query: string,
  onSearch?: (query: string) => Promise<OmnibarSearchResult[]>,
) => {
  const [emptyResults] = useState<OmnibarSearchResult[]>([])
  const [externalResults, setExternalResults] = useState<OmnibarSearchResult[]>(
    [],
  )

  useEffect(() => {
    if (!query || !onSearch) {
      return
    }
    const timer = setTimeout(() => {
      onSearch(query).then(setExternalResults)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  if (!query) {
    return emptyResults
  }
  return externalResults
}
