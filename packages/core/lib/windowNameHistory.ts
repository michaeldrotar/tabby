export const WINDOW_NAME_HISTORY_KEY = 'tabby-window-name-history'

export const readWindowNameHistory = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value
    .flatMap((item) => {
      if (typeof item !== 'string') return []
      const name = item.trim().slice(0, 120)
      const key = name.toLocaleLowerCase()
      if (!name || seen.has(key)) return []
      seen.add(key)
      return [name]
    })
    .slice(0, 50)
}
