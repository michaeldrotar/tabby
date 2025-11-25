import { useEffect, useState } from 'react'
import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const useOmnibarSearch = (
  query: string,
  onSearch?: (query: string) => Promise<OmnibarSearchItem[]>,
) => {
  const [externalResults, setExternalResults] = useState<OmnibarSearchItem[]>(
    [],
  )

  useEffect(() => {
    if (!query || !onSearch) {
      setExternalResults([])
      return
    }
    const timer = setTimeout(() => {
      onSearch(query).then(setExternalResults)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  return externalResults
}
