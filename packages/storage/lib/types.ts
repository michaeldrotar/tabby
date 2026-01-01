import type { ValueOrUpdateType } from './base/types.js'

export type BaseStorageType<D> = {
  get: () => Promise<D>
  set: (value: ValueOrUpdateType<D>) => Promise<void>
  getSnapshot: () => D | null
  subscribe: (listener: () => void) => () => void
}
