export const formatSelectionCount = (count: number): string =>
  count > 99 ? '100+' : String(count)
