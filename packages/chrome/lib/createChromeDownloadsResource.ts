import type {
  DownloadsResource,
  DownloadsSnapshot,
  RecentDownload,
} from '@extension/core/downloads'

const permissions: chrome.permissions.Permissions = {
  permissions: ['downloads', 'downloads.open'],
}
const safeDangerTypes = new Set([
  'safe',
  'accepted',
  'allowlistedByPolicy',
  'deepScannedSafe',
])

export const projectDownload = (
  item: chrome.downloads.DownloadItem,
): RecentDownload => {
  const warning = !safeDangerTypes.has(item.danger)
  let source: string | undefined
  try {
    const url = new URL(item.finalUrl || item.url)
    if (url.protocol === 'http:' || url.protocol === 'https:')
      source = url.hostname
  } catch {
    /* Some downloads have no accessible source URL. */
  }
  const active = item.state === 'in_progress'
  const available = item.state === 'complete' && item.exists && !warning
  return {
    id: item.id,
    filename: item.filename.split(/[\\/]/).at(-1) || 'Unnamed download',
    source,
    warning,
    status: warning
      ? 'Needs review in Chrome'
      : active
        ? item.paused
          ? 'Paused'
          : 'Downloading'
        : item.state === 'interrupted'
          ? item.error === 'USER_CANCELED'
            ? 'Canceled'
            : 'Interrupted'
          : item.exists
            ? 'Completed'
            : 'File unavailable',
    actions: warning
      ? []
      : available
        ? ['open', 'show', 'erase']
        : active
          ? [item.paused ? 'resume' : 'pause', 'cancel']
          : item.canResume
            ? ['resume', 'erase']
            : ['erase'],
  }
}

export const createChromeDownloadsResource = (
  api: Pick<typeof chrome, 'downloads' | 'permissions' | 'tabs'>,
): DownloadsResource => {
  let snapshot: DownloadsSnapshot = {
    status: 'loading',
    items: [],
    canOpen: false,
  }
  let running = false
  let revision = 0
  let detachDownloads: (() => void) | undefined
  const listeners = new Set<() => void>()
  const publish = (next: DownloadsSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  const refresh = async () => {
    const operation = ++revision
    try {
      const [granted, canOpen] = await Promise.all([
        api.permissions.contains({ permissions: ['downloads'] }),
        api.permissions.contains({ permissions: ['downloads.open'] }),
      ])
      if (!running || operation !== revision) return
      if (!granted) {
        detachDownloads?.()
        detachDownloads = undefined
        publish({ status: 'permission', items: [], canOpen: false })
        return
      }
      if (!detachDownloads) {
        api.downloads.onCreated.addListener(changed)
        api.downloads.onChanged.addListener(changed)
        api.downloads.onErased.addListener(changed)
        detachDownloads = () => {
          api.downloads.onCreated.removeListener(changed)
          api.downloads.onChanged.removeListener(changed)
          api.downloads.onErased.removeListener(changed)
        }
      }
      const items = await api.downloads.search({
        orderBy: ['-startTime'],
        limit: 5,
      })
      if (running && operation === revision)
        publish({ status: 'ready', items: items.map(projectDownload), canOpen })
    } catch {
      if (running && operation === revision)
        publish({
          ...snapshot,
          status:
            snapshot.status === 'loading' ? 'permission' : snapshot.status,
          error:
            'Could not load recent downloads. Switch to Tabs, then try Downloads again.',
        })
    }
  }
  const changed = () => {
    void refresh()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    start: async () => {
      if (running) return
      running = true
      api.permissions.onAdded.addListener(changed)
      api.permissions.onRemoved.addListener(changed)
      await refresh()
    },
    dispose: () => {
      running = false
      revision++
      detachDownloads?.()
      detachDownloads = undefined
      api.permissions.onAdded.removeListener(changed)
      api.permissions.onRemoved.removeListener(changed)
      snapshot = { status: 'loading', items: [], canOpen: false }
    },
    requestAccess: async () => {
      try {
        const granted = await api.permissions.request(permissions)
        await refresh()
        if (running && !granted)
          publish({
            ...snapshot,
            error:
              'Download access was not granted. You can keep managing tabs or try again.',
          })
      } catch {
        if (running)
          publish({
            ...snapshot,
            error: 'Could not request download access. Try again.',
          })
      }
    },
    execute: async (ids, action) => {
      if (!running || (action === 'open' && !snapshot.canOpen)) return
      const requested = new Set(typeof ids === 'number' ? [ids] : ids)
      const eligible = snapshot.items.filter(
        (item) => requested.has(item.id) && item.actions.includes(action),
      )
      const results = await Promise.allSettled(
        eligible.map(async ({ id }) => {
          if (action === 'erase') await api.downloads.erase({ id })
          else await api.downloads[action](id)
        }),
      )
      await refresh()
      const failed = results.filter(
        (result) => result.status === 'rejected',
      ).length
      if (running && failed)
        publish({
          ...snapshot,
          error: `${failed === 1 ? 'A download' : `${failed} downloads`} could not be updated. The file or download may no longer be available. Check Chrome downloads.`,
        })
    },
    openAll: async () => {
      await api.tabs.create({ url: 'chrome://downloads/' })
    },
  }
}
