import {
  createDiscoveryResource,
  discoveryStorageKeys,
} from '@extension/core/discovery'
import type { DiscoveryPersistence } from '@extension/core/discovery'

export const DISCOVERY_STORAGE_PREFIX = 'tabby-discovery-'

export const createChromeDiscovery = (
  api: Pick<typeof chrome, 'storage'>,
  withLock: DiscoveryPersistence['withLock'] = (action) =>
    navigator.locks.request('tabby-discovery', action),
) => {
  const unprefix = (values: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(values)
        .filter(([key]) => key.startsWith(DISCOVERY_STORAGE_PREFIX))
        .map(([key, value]) => [
          key.slice(DISCOVERY_STORAGE_PREFIX.length),
          value,
        ]),
    )
  return createDiscoveryResource({
    withLock,
    load: async () =>
      unprefix(
        await api.storage.local.get(
          discoveryStorageKeys.map(
            (key) => `${DISCOVERY_STORAGE_PREFIX}${key}`,
          ),
        ),
      ),
    save: async (values) => {
      await api.storage.local.set(
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [
            `${DISCOVERY_STORAGE_PREFIX}${key}`,
            value,
          ]),
        ),
      )
    },
    subscribe: (listener) => {
      const onChanged = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string,
      ) => {
        if (area !== 'local') return
        const patch = unprefix(
          Object.fromEntries(
            Object.entries(changes).map(([key, change]) => [
              key,
              change.newValue,
            ]),
          ),
        )
        if (Object.keys(patch).length) listener(patch)
      }
      api.storage.onChanged.addListener(onChanged)
      return () => api.storage.onChanged.removeListener(onChanged)
    },
  })
}
