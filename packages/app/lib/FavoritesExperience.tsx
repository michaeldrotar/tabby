import { Favorites } from '@extension/ui/tab-manager/ui/Favorites'
import { useRef, useState, useSyncExternalStore } from 'react'
import { useTabManagerResources } from './TabbyProvider'
import type { BookmarkResource } from '@extension/core/bookmarks'

export const FavoritesExperience = ({
  bookmarks,
}: {
  bookmarks: BookmarkResource
}) => {
  const { preferences, host } = useTabManagerResources()
  const snapshot = useSyncExternalStore(
    bookmarks.subscribe,
    bookmarks.getSnapshot,
    bookmarks.getSnapshot,
  )
  const preference = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
    preferences.getSnapshot,
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const pending = useRef(false)
  const run = async (action: () => Promise<string | void>) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      setMessage((await action()) || '')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not update favorites.',
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <Favorites
      snapshot={snapshot}
      folderId={preference.favoritesFolderId}
      busy={busy}
      message={message}
      error={error}
      onSelectFolder={(favoritesFolderId) => {
        void run(async () => {
          await preferences.set({ favoritesFolderId })
        })
      }}
      onCreateFolder={() => {
        void run(async () => {
          const favoritesFolderId = await bookmarks.createFolder()
          await preferences.set({ favoritesFolderId })
          return 'Created Tabby Favorites.'
        })
      }}
      onAdd={(folderId) => {
        void run(async () =>
          (await bookmarks.addCurrentTab(
            folderId,
            host?.getCurrentWindowId?.(),
          ))
            ? 'Added to favorites.'
            : 'This page is already in this folder.',
        )
      }}
      onRemove={(id) => {
        void run(async () => {
          await bookmarks.remove(id)
          return 'Removed bookmark.'
        })
      }}
      onOpen={(id, mode) => {
        void run(() => bookmarks.open(id, mode, host?.getCurrentWindowId?.()))
      }}
      onOpenManager={() => {
        void run(() =>
          bookmarks.openManager(preference.favoritesFolderId ?? undefined),
        )
      }}
      onRetry={() => {
        void run(() => bookmarks.refresh())
      }}
    />
  )
}
