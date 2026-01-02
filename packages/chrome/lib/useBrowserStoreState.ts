import { useBrowserStore } from './useBrowserStore.js'

/**
 * Returns the current loading state of the browser store.
 *
 * @returns 'initial' | 'loading' | 'loaded'
 *
 * @example
 * const state = useBrowserStoreState()
 * if (state !== 'loaded') {
 *   return <LoadingSkeleton />
 * }
 */
export const useBrowserStoreState = () => {
  return useBrowserStore((state) => state.state)
}
