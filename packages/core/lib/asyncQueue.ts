/** Serialize owned operations; a failed operation does not block later work. */
export const createAsyncQueue = () => {
  let pending: Promise<unknown> = Promise.resolve()
  return {
    run: <T>(operation: () => Promise<T>): Promise<T> => {
      const previous = pending
      const task = (async () => {
        try {
          await previous
        } catch {
          // Each caller handles its own operation's failure.
        }
        return operation()
      })()
      pending = task
      return task
    },
    wait: () => pending,
  }
}
