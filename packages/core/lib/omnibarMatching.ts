export const createOmnibarMatcher = (query: string) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return (title = '', url = '', aliases: readonly string[] = []): boolean => {
    const text = [title, url, ...aliases].join(' ').toLowerCase()
    return terms.every((term) => text.includes(term))
  }
}
