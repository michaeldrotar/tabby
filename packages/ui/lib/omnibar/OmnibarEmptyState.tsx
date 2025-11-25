type OmnibarEmptyStateProps = {
  query: string
  hasResults: boolean
}

export const OmnibarEmptyState = ({
  query,
  hasResults,
}: OmnibarEmptyStateProps) => {
  if (hasResults) return null

  if (query) {
    return (
      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
        No results found for "{query}"
      </div>
    )
  }

  return (
    <div className="px-4 py-8 text-center text-xs text-gray-400">
      Type to search tabs, bookmarks, history, or enter a URL
    </div>
  )
}
