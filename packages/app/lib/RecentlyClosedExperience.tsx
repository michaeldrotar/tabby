import { RecentlyClosedItems } from '@extension/ui/tab-manager/RecentlyClosedItems'
import { TabManagerShell } from '@extension/ui/tab-manager/ui/TabManagerShell'
import { TabManagerTools } from '@extension/ui/tab-manager/ui/TabManagerTools'
import { useEffect, useSyncExternalStore } from 'react'
import type { RecentlyClosedResource } from '@extension/core/recentlyClosed'
import type { TabManagerIntent } from '@extension/ui/tab-manager/TabManager'

export const RecentlyClosedExperience = ({
  resource,
  locale,
  onIntent,
}: {
  resource: RecentlyClosedResource
  locale?: string
  onIntent: (intent: TabManagerIntent) => void
}) => {
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  useEffect(() => {
    void resource.start()
  }, [resource])
  return (
    <TabManagerShell
      className="h-full"
      mainLabel="Recently closed"
      actionBar={<TabManagerTools onIntent={onIntent} />}
    >
      <RecentlyClosedItems
        snapshot={snapshot}
        onRestore={(id) => {
          void resource.restore(id)
        }}
        onRefresh={() => {
          void resource.refresh()
        }}
        formatClosedAt={(timestamp) =>
          new Date(timestamp).toLocaleString(locale, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        }
      />
    </TabManagerShell>
  )
}
