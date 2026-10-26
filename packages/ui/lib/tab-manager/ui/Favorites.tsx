import { findBookmark } from '@extension/core/bookmarks'
import { ArrowLeft, Bookmark, Folder, Plus, Settings2, X } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Favicon } from '../../Favicon'
import type {
  BookmarkNode,
  BookmarkOpenMode,
  BookmarkSnapshot,
} from '@extension/core/bookmarks'
import type { KeyboardEvent, MouseEvent } from 'react'

export type FavoritesProps = {
  snapshot: BookmarkSnapshot
  folderId: string | null
  busy: boolean
  message?: string
  error?: string
  onSelectFolder: (id: string | null) => void
  onCreateFolder: () => void
  onAdd: (folderId: string) => void
  onRemove: (id: string) => void
  onOpen: (id: string, mode: BookmarkOpenMode) => void
  onOpenManager: () => void
  onRetry: () => void
}

const controlClass =
  'rounded-md px-2 py-1.5 text-xs outline-none hover:bg-[var(--manager-control-hover)] focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50'

const folderChoices = (
  nodes: readonly BookmarkNode[],
  path = '',
): { id: string; label: string }[] =>
  nodes.flatMap((node) => {
    if (node.url) return []
    const label = [path, node.title].filter(Boolean).join(' / ')
    return [
      ...(node.title ? [{ id: node.id, label }] : []),
      ...folderChoices(node.children ?? [], label),
    ]
  })

const openMode = (event: MouseEvent | KeyboardEvent): BookmarkOpenMode =>
  event.shiftKey
    ? 'new-window'
    : event.metaKey ||
        event.ctrlKey ||
        ('button' in event && event.button === 1)
      ? 'new-tab'
      : 'default'

export const Favorites = ({
  snapshot,
  folderId,
  busy,
  message,
  error,
  onSelectFolder,
  onCreateFolder,
  onAdd,
  onRemove,
  onOpen,
  onOpenManager,
  onRetry,
}: FavoritesProps) => {
  const [settings, setSettings] = useState(false)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const entries = useRef<HTMLDivElement>(null)
  const pendingFolderFocus = useRef(false)
  const [location, setLocation] = useState<{
    root: string | null
    id: string | null
  }>({ root: folderId, id: null })
  const root = folderId ? findBookmark(snapshot.roots, folderId) : undefined
  const nested =
    location.root === folderId && location.id
      ? findBookmark(root?.children ?? [], location.id)
      : undefined
  const folder = nested && !nested.url ? nested : root
  useLayoutEffect(() => {
    if (!pendingFolderFocus.current) return
    pendingFolderFocus.current = false
    const target =
      entries.current?.querySelector<HTMLButtonElement>('button') ??
      settingsButton.current
    target?.focus()
  }, [folder?.id])
  const missing = Boolean(folderId && !root && snapshot.state === 'loaded')
  const setup = settings || missing
  const choices = useMemo(() => {
    const folders = folderChoices(snapshot.roots)
    const counts = new Map<string, number>()
    folders.forEach(({ label }) =>
      counts.set(label, (counts.get(label) ?? 0) + 1),
    )
    return folders.map((folder) => ({
      ...folder,
      label:
        counts.get(folder.label)! > 1
          ? `${folder.label} (${folder.id})`
          : folder.label,
    }))
  }, [snapshot.roots])
  const open = (node: BookmarkNode, event: MouseEvent | KeyboardEvent) => {
    if (node.url) onOpen(node.id, openMode(event))
    else {
      pendingFolderFocus.current = true
      setLocation({ root: folderId, id: node.id })
    }
  }
  return (
    <section
      aria-label="Favorites"
      data-keyboard-section="favorites"
      className="border-border shrink-0 border-b px-3 py-2"
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && settings) {
          event.preventDefault()
          setSettings(false)
          settingsButton.current?.focus()
          return
        }
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('input,select,textarea')
        )
          return
        if (
          !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
            event.key,
          ) ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        )
          return
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)',
          ),
        )
        const index = buttons.indexOf(event.target as HTMLButtonElement)
        const next =
          buttons[
            index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1)
          ]
        if (next) {
          event.preventDefault()
          next.focus()
          next.scrollIntoView({ block: 'nearest' })
        }
      }}
    >
      <div className="flex items-center gap-1">
        <Bookmark
          size={14}
          className="text-muted shrink-0"
          aria-hidden="true"
        />
        <h2
          className="min-w-0 flex-1 truncate text-xs font-medium"
          title={folder?.title}
        >
          Favorites{root ? ` · ${root.title}` : ''}
        </h2>
        {root && (
          <button
            type="button"
            className={controlClass}
            disabled={busy || folder?.readOnly}
            title="Add the current tab to favorites"
            aria-label="Add current tab to favorites"
            onClick={() => onAdd(folder!.id)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        )}
        <button
          ref={settingsButton}
          type="button"
          className={controlClass}
          aria-label={root ? 'Favorite settings' : 'Set up favorites'}
          aria-expanded={setup}
          onClick={() => setSettings(!settings)}
        >
          {root ? <Settings2 size={16} aria-hidden="true" /> : 'Set up'}
        </button>
      </div>
      {snapshot.state === 'loading' ? (
        <p role="status" className="text-muted py-2 text-xs">
          Loading favorites…
        </p>
      ) : snapshot.state === 'error' ? (
        <div className="py-2 text-xs">
          <p role="alert">{snapshot.error || 'Could not load bookmarks.'}</p>
          <button type="button" className={controlClass} onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {!root && !setup && (
            <p className="text-muted py-1 text-xs">
              Choose a bookmark folder to keep pages close.
            </p>
          )}
          {setup && (
            <div className="space-y-2 py-2 text-xs">
              <p className="text-muted">
                {missing
                  ? 'Your favorites folder is no longer available. Choose another folder or create one.'
                  : 'Choose a Chrome bookmark folder for your favorites.'}
              </p>
              <label className="block">
                Bookmark folder
                <select
                  className={`
                    border-border bg-input mt-1 block w-full min-w-0 rounded-md
                    border p-2 outline-none
                    focus-visible:ring-focus focus-visible:ring-2
                  `}
                  value={root?.id ?? ''}
                  disabled={busy}
                  onChange={(event) => {
                    onSelectFolder(event.target.value || null)
                    setLocation({ root: null, id: null })
                  }}
                >
                  <option value="">Choose a folder</option>
                  {choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className={controlClass}
                  disabled={busy}
                  onClick={onCreateFolder}
                >
                  Create Tabby Favorites
                </button>
                <button
                  type="button"
                  className={controlClass}
                  disabled={busy}
                  onClick={onOpenManager}
                >
                  Open Chrome bookmarks
                </button>
                {root && (
                  <button
                    type="button"
                    className={controlClass}
                    onClick={() => setSettings(false)}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          )}
          {folder && (
            <>
              {folder !== root && (
                <button
                  type="button"
                  className={`
                    ${controlClass}
                    flex items-center gap-1
                  `}
                  onClick={() => {
                    pendingFolderFocus.current = true
                    setLocation({ root: folderId, id: null })
                  }}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  Back to {root?.title}
                </button>
              )}
              {folder !== root && (
                <p className="text-muted truncate py-1 text-xs">
                  {folder.title}
                </p>
              )}
              <div ref={entries} className="max-h-32 overflow-y-auto py-1">
                {folder.children?.length ? (
                  <ul
                    className="flex flex-wrap gap-1"
                    aria-label={folder.title}
                  >
                    {folder.children.map((node) => (
                      <li
                        key={node.id}
                        className="flex max-w-full items-center"
                      >
                        <button
                          type="button"
                          className={`
                            ${controlClass}
                            flex max-w-40 items-center gap-2 text-left
                          `}
                          title={
                            node.url ? `${node.title}\n${node.url}` : node.title
                          }
                          onClick={(event) => open(node, event)}
                          onAuxClick={(event) => {
                            if (event.button === 1 && node.url) {
                              event.preventDefault()
                              open(node, event)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === 'Enter' &&
                              (event.metaKey || event.ctrlKey || event.shiftKey)
                            ) {
                              event.preventDefault()
                              open(node, event)
                            }
                          }}
                        >
                          {node.url ? (
                            node.faviconUrl ? (
                              <Favicon
                                faviconUrl={node.faviconUrl}
                                size={16}
                                className="shrink-0"
                              />
                            ) : (
                              <Bookmark
                                size={16}
                                className="shrink-0"
                                aria-hidden="true"
                              />
                            )
                          ) : (
                            <Folder
                              size={16}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">
                            {node.title || node.url || 'Untitled folder'}
                          </span>
                        </button>
                        {settings && node.url && !node.readOnly && (
                          <button
                            type="button"
                            className={controlClass}
                            aria-label={`Remove ${node.title || node.url} from bookmarks`}
                            disabled={busy}
                            onClick={() => {
                              settingsButton.current?.focus()
                              onRemove(node.id)
                            }}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted py-2 text-xs">
                    {folder.readOnly
                      ? 'This folder has no bookmarks.'
                      : 'No favorites yet. Use + to add the current tab.'}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="py-1 text-xs">
          {error}
        </p>
      )}
      <p
        role="status"
        className={message ? 'text-muted py-1 text-xs' : 'sr-only'}
      >
        {message}
      </p>
    </section>
  )
}
