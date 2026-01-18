/**
 * Tab lifecycle status represents the loading state with more granularity than Chrome's binary status.
 * - 'initializing': Tab was just created, we don't have full info yet (no url)
 * - 'loading': Tab is loading for the first time
 * - 'loaded': Tab is fully loaded (Chrome status === 'complete' or 'unloaded')
 * - 'reloading': Tab was previously loaded and is now loading again
 */
export type BrowserTabLifecycle =
  | 'initializing'
  | 'loading'
  | 'loaded'
  | 'reloading'
