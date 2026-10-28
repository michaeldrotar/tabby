import {
  bookmarkLabel,
  bookmarkSelectionRoots,
  canAddBookmarks,
  flattenBookmarks,
} from '@extension/core/bookmarks'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSurfaceInputOwner } from '../Surface'
import { cn } from '../utils/cn'
import type { TabManagerWindowView } from './TabManager'
import type { BookmarkNode } from '@extension/core/bookmarks'

export const bookmarkControlClass =
  'rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50'
const inputClass =
  'mt-1 block min-h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
export type BookmarkEditorRequest = {
  kind: 'bookmark' | 'folder' | 'edit' | 'move' | 'delete' | 'save'
  ids: string[]
}
export type BookmarkEditCommand = BookmarkEditorRequest & {
  title: string
  url: string
  parentId: string
  index?: number
  windowId: number
  newFolder: boolean
}
const FolderOptions = memo(
  ({
    folders,
    labels,
  }: {
    folders: BookmarkNode[]
    labels: Map<string, string>
  }) => (
    <>
      <option value="" disabled>
        Choose a folder
      </option>
      {folders.map((node) => (
        <option key={node.id} value={node.id}>
          {labels.get(node.id)}
        </option>
      ))}
    </>
  ),
)

export const BookmarkEditor = ({
  request,
  nodes,
  folderId,
  folderLabels,
  windows,
  windowId,
  busy,
  onSubmit,
  onCancel,
}: {
  request: BookmarkEditorRequest
  nodes: BookmarkNode[]
  folderId: string
  folderLabels: Map<string, string>
  windows: TabManagerWindowView[]
  windowId: number | null
  busy: boolean
  onSubmit: (command: BookmarkEditCommand) => void
  onCancel: () => void
}) => {
  const { kind, ids } = request
  const targets = useMemo(
    () => bookmarkSelectionRoots(nodes, ids),
    [nodes, ids],
  )
  const node = nodes.find((node) => node.id === ids[0])
  const [title, setTitle] = useState(
    kind === 'save'
      ? (windows.find((window) => window.id === windowId)?.title ??
          'Saved window')
      : node
        ? bookmarkLabel(node)
        : '',
  )
  const [url, setUrl] = useState(node?.url ?? '')
  const [parentId, setParentId] = useState(
    kind === 'move'
      ? (node?.parentId ?? '')
      : (nodes.find((node) => node.id === folderId && canAddBookmarks(node))
          ?.id ??
          nodes.find(canAddBookmarks)?.id ??
          ''),
  )
  const [position, setPosition] = useState('')
  const [saveWindowId, setSaveWindowId] = useState(
    windowId ?? windows[0]?.id ?? 0,
  )
  const [newFolder, setNewFolder] = useState(true)
  const form = useRef<HTMLFormElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
  useLayoutEffect(() => {
    if (canFocusInput())
      form.current?.querySelector<HTMLElement>('input,select,button')?.focus()
  }, [canFocusInput])
  const folders = useMemo(() => {
    const excluded = new Set(
      kind === 'move' ? flattenBookmarks(targets).map((node) => node.id) : [],
    )
    return nodes.filter(
      (node) => canAddBookmarks(node) && !excluded.has(node.id),
    )
  }, [kind, nodes, targets])
  const descendants = useMemo(
    () => targets.flatMap((node) => flattenBookmarks(node.children ?? [])),
    [targets],
  )
  const remainingChildren = (
    nodes.find((node) => node.id === parentId)?.children ?? []
  ).filter((node) => !ids.includes(node.id))
  return (
    <form
      ref={form}
      aria-label="Bookmark editor"
      className="border-border space-y-3 rounded-md border p-3 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          ...request,
          title,
          url,
          parentId,
          index: position ? Number(position) - 1 : undefined,
          windowId: saveWindowId,
          newFolder,
        })
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && !busy) {
          event.stopPropagation()
          onCancel()
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-3 font-medium">
          {kind === 'delete'
            ? 'Delete bookmark items'
            : kind === 'move'
              ? 'Move or reorder'
              : kind === 'save'
                ? 'Bookmark a window'
                : kind === 'edit'
                  ? 'Edit bookmark item'
                  : kind === 'folder'
                    ? 'New folder'
                    : 'New bookmark'}
        </legend>
        {kind === 'save' && (
          <>
            <label className="block">
              Window
              <select
                className={inputClass}
                value={saveWindowId}
                onChange={(event) =>
                  setSaveWindowId(Number(event.target.value))
                }
              >
                {windows.map((window) => (
                  <option key={window.id} value={window.id}>
                    {window.title} ({window.tabs.length} tabs)
                    {window.incognito ? ' · Private' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newFolder}
                onChange={(event) => setNewFolder(event.target.checked)}
              />
              Create a new folder
            </label>
            <p className="text-muted text-xs">
              Saves URLs, titles, order, and group names and colors. Page state,
              history, pinned tabs, active selection, and window size or
              position are not saved.
            </p>
          </>
        )}
        {!['move', 'delete'].includes(kind) &&
          !(kind === 'save' && !newFolder) && (
            <label className="block">
              Name
              <input
                required
                className={inputClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
          )}
        {(kind === 'bookmark' ||
          (kind === 'edit' && node?.url !== undefined)) && (
          <label className="block">
            URL
            <input
              required
              className={inputClass}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </label>
        )}
        {['bookmark', 'folder', 'move', 'save'].includes(kind) && (
          <label className="block">
            {kind === 'save' && !newFolder
              ? 'Save into folder'
              : 'Parent folder'}
            <select
              required
              className={inputClass}
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <FolderOptions folders={folders} labels={folderLabels} />
            </select>
          </label>
        )}
        {kind === 'move' && (
          <>
            {targets.length > 1 && (
              <p>Move {targets.length} items together, keeping their order.</p>
            )}
            <label className="block">
              Position (leave blank for end)
              <input
                type="number"
                min="1"
                max={remainingChildren.length + 1}
                step="1"
                className={inputClass}
                value={position}
                onChange={(event) => setPosition(event.target.value)}
              />
            </label>
          </>
        )}
        {kind === 'delete' && (
          <p className="break-words">
            Delete{' '}
            {targets.length === 1
              ? `“${bookmarkLabel(targets[0]!) || 'Untitled'}”`
              : `${targets.length} items: ${targets
                  .slice(0, 5)
                  .map((node) => `“${bookmarkLabel(node) || 'Untitled'}”`)
                  .join(', ')}${targets.length > 5 ? ', …' : ''}`}
            {descendants.length
              ? ` and all ${descendants.filter((node) => node.url !== undefined).length} bookmarks and ${descendants.filter((node) => node.url === undefined).length} folders inside them`
              : ''}
            ? This removes them from Chrome bookmarks on your synced devices.
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={bookmarkControlClass}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cn(bookmarkControlClass, 'bg-accent-selected')}
          >
            {kind === 'delete'
              ? 'Delete permanently'
              : kind === 'move'
                ? 'Move'
                : kind === 'save'
                  ? 'Bookmark window'
                  : 'Save'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
