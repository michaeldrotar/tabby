/**
 * Creates a function that memoizes the result of `fn`.
 */
export const memoize = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FN extends (...args: any[]) => any,
>(
  fn: FN,
): FN => {
  const cache = new Map<string, ReturnType<FN>>()

  return function (...args: Parameters<FN>): ReturnType<FN> {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<FN>
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  } as FN
}
