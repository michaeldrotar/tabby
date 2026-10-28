import { Download, FileText, TriangleAlert } from 'lucide-react'
import { BrowserTabItem } from '../BrowserTabItem'
import { TabList, TabListItem } from '../TabList'
import { cn } from '../utils/cn'
import { windowControlClass } from './ui/WindowNavigation'
import type { DownloadsSnapshot } from '@extension/core/downloads'
import type { KeyboardEvent, MouseEvent, RefObject } from 'react'

export const DownloadsHeader = ({
  snapshot,
}: {
  snapshot: DownloadsSnapshot
}) => (
  <header
    className={`
      border-border flex min-h-[72px] shrink-0 items-center border-b
      bg-[var(--manager-chrome)] px-5 py-3
    `}
  >
    <div className="min-w-0">
      <h2 className="text-sm font-medium">Downloads</h2>
      <p className="text-muted text-xs">
        {snapshot.status === 'ready'
          ? `${snapshot.items.length} recent download${snapshot.items.length === 1 ? '' : 's'}`
          : 'Recent files from Chrome'}
      </p>
    </div>
  </header>
)

export const RecentDownloads = ({
  snapshot,
  selectedIds,
  focusedId,
  listRef,
  onSelect,
  onActivate,
  onFocus,
  onKeyDown,
  onContextMenu,
  onRequestAccess,
  onOpenAll,
}: {
  snapshot: DownloadsSnapshot
  selectedIds: ReadonlySet<number>
  focusedId?: number
  listRef: RefObject<HTMLDivElement | null>
  onSelect: (id: number, event: MouseEvent) => void
  onActivate: (id: number) => void
  onFocus: (id: number) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onContextMenu: (id: number, event: MouseEvent) => void
  onRequestAccess: () => void
  onOpenAll: () => void
}) => (
  <div ref={listRef} role="presentation" className="p-2" onKeyDown={onKeyDown}>
    {snapshot.error ? (
      <p role="alert" className="px-3 py-2 text-sm">
        {snapshot.error}
      </p>
    ) : null}
    {snapshot.status === 'loading' ? (
      <p role="status" className="text-muted px-3 py-4 text-sm">
        Loading downloads…
      </p>
    ) : snapshot.status === 'permission' ? (
      <div className="space-y-4 px-3 py-6">
        <Download size={24} className="text-muted" aria-hidden="true" />
        <h2 className="text-base font-medium">Your recent downloads</h2>
        <p className="text-muted text-sm leading-relaxed">
          Allow Tabby to read your download history and open downloaded files.
          Your downloads stay on this device.
        </p>
        <button
          className={cn(windowControlClass, 'bg-accent-soft text-foreground')}
          onClick={onRequestAccess}
        >
          Allow downloads
        </button>
      </div>
    ) : (
      <>
        {!snapshot.canOpen ? (
          <div className="space-y-2 px-3 py-3 text-sm">
            <p>To open files here, allow Tabby to open downloaded files.</p>
            <button className={windowControlClass} onClick={onRequestAccess}>
              Allow opening files
            </button>
          </div>
        ) : null}
        {snapshot.items.length ? (
          <TabList>
            {snapshot.items.map((item) => (
              <TabListItem key={item.id}>
                <BrowserTabItem
                  data-download-id={item.id}
                  itemLabel="Download"
                  title={item.filename}
                  description={`${item.status}${item.source ? ` · ${item.source}` : ''}`}
                  favicon={
                    item.warning ? (
                      <TriangleAlert size={20} aria-hidden="true" />
                    ) : (
                      <FileText size={20} aria-hidden="true" />
                    )
                  }
                  selected={selectedIds.has(item.id)}
                  data-focus={item.id === focusedId || undefined}
                  onClick={(event) => onSelect(item.id, event)}
                  onActivate={() => onActivate(item.id)}
                  onFocus={() => onFocus(item.id)}
                  onContextMenu={(event) => onContextMenu(item.id, event)}
                />
              </TabListItem>
            ))}
          </TabList>
        ) : (
          <p className="text-muted px-3 py-6 text-sm">
            No recent downloads. Files you download in Chrome will appear here.
          </p>
        )}
      </>
    )}
    <button className={cn(windowControlClass, 'mt-3')} onClick={onOpenAll}>
      All downloads in Chrome
    </button>
  </div>
)
