import { useCallback, useRef, useState } from 'react'
import type { DragEvent } from 'react'

export type DragItemType = 'tab' | 'group'

export type DragItem = {
  type: DragItemType
  id: number
  groupId?: number
}

/**
 * Represents where to drop an item.
 *
 * We use a simple model: identify the item AFTER which we're dropping.
 * - afterItemKey: Key of the item after which we drop (format: "tab-123" or "group-456")
 *   - null means drop at the very beginning (before first item)
 * - insideGroupId: If defined, the tab should be added to this group
 */
export type DropTarget = {
  afterItemKey: string | null
  insideGroupId?: number
}

export const makeItemKey = (type: DragItemType, id: number): string =>
  `${type}-${id}`

export const parseItemKey = (
  key: string,
): { type: DragItemType; id: number } | null => {
  const match = key.match(/^(tab|group)-(\d+)$/)
  if (!match) return null
  return { type: match[1] as DragItemType, id: parseInt(match[2], 10) }
}

/**
 * Hook providing drag and drop state and handlers for tab/group reordering.
 *
 * Uses a "drop after item" model where we track which item the dragged element
 * should be placed after (or null for the start of the list).
 */
export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const dragCounterRef = useRef(0)

  const handleDragStart = useCallback((e: DragEvent, item: DragItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(item))

    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect()
      e.dataTransfer.setDragImage(
        e.currentTarget,
        e.clientX - rect.left,
        e.clientY - rect.top,
      )
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDropTarget(null)
    dragCounterRef.current = 0
  }, [])

  /**
   * Called when dragging over an item. Calculates the drop target based on
   * which half of the element the cursor is in.
   *
   * @param e - The drag event
   * @param itemKey - Key of the item being hovered ("tab-123" or "group-456")
   * @param prevItemKey - Key of the previous item in the list (null if first)
   * @param insideGroupId - If this item is inside a group, the group's ID
   * @param prevInsideGroupId - If the previous item is inside a group, that group's ID
   */
  const handleDragOver = useCallback(
    (
      e: DragEvent,
      itemKey: string,
      prevItemKey: string | null,
      insideGroupId?: number,
      prevInsideGroupId?: number,
    ) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedItem) return

      const parsed = parseItemKey(itemKey)
      if (!parsed) return

      // Don't allow dropping on self
      if (draggedItem.type === parsed.type && draggedItem.id === parsed.id) {
        e.dataTransfer.dropEffect = 'none'
        return
      }

      // Don't allow dropping a group inside another group
      if (draggedItem.type === 'group' && insideGroupId !== undefined) {
        e.dataTransfer.dropEffect = 'none'
        return
      }

      e.dataTransfer.dropEffect = 'move'

      // Calculate which half of the element we're in
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const isTopHalf = y < rect.height / 2

      // If in top half, drop after the previous item; if bottom half, drop after this item
      const afterKey = isTopHalf ? prevItemKey : itemKey

      // Determine which group (if any) the dropped item should belong to
      // - If dropping after an item that's in a group, the new item goes in that group
      // - If dropping after a group header, the new item goes in that group (at the start)
      // - If dropping after an ungrouped item, the new item is ungrouped
      let targetGroupId: number | undefined
      if (isTopHalf) {
        // Dropping in the "before" position of current item = after previous item
        targetGroupId = prevInsideGroupId
      } else {
        // Dropping in the "after" position of current item
        if (parsed.type === 'group') {
          // Dropping after a group header means inside that group (at the start)
          targetGroupId = parsed.id
        } else {
          // Dropping after a tab - inherit that tab's group membership
          targetGroupId = insideGroupId
        }
      }

      setDropTarget({
        afterItemKey: afterKey,
        insideGroupId: targetGroupId,
      })
    },
    [draggedItem],
  )

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setDropTarget(null)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedItem || !dropTarget) {
        handleDragEnd()
        return
      }

      try {
        await performDrop(draggedItem, dropTarget)
      } catch (error) {
        console.error('Drop operation failed:', error)
      }

      handleDragEnd()
    },
    [draggedItem, dropTarget, handleDragEnd],
  )

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  }
}

/**
 * Performs the actual Chrome API calls to move tabs/groups after a drop.
 */
const performDrop = async (
  draggedItem: DragItem,
  dropTarget: DropTarget,
): Promise<void> => {
  if (draggedItem.type === 'tab') {
    await performTabDrop(draggedItem, dropTarget)
  } else {
    await performGroupDrop(draggedItem, dropTarget)
  }
}

const performTabDrop = async (
  draggedItem: DragItem,
  dropTarget: DropTarget,
): Promise<void> => {
  const draggedTab = await chrome.tabs.get(draggedItem.id)
  if (!draggedTab || draggedTab.id === undefined) return

  const wasInGroup =
    draggedTab.groupId !== undefined && draggedTab.groupId !== -1

  // Calculate target index based on what we're dropping after
  let targetIndex: number

  if (dropTarget.afterItemKey === null) {
    // Drop at the very beginning
    targetIndex = 0
  } else {
    const parsed = parseItemKey(dropTarget.afterItemKey)
    if (!parsed) return

    if (parsed.type === 'tab') {
      const afterTab = await chrome.tabs.get(parsed.id)
      if (!afterTab) return
      targetIndex = afterTab.index + 1
    } else {
      // Dropping after a group - behavior depends on insideGroupId:
      // - If insideGroupId matches the group → inside group at start (before first tab)
      // - If insideGroupId is undefined → after the whole group (after last tab)
      const groupTabs = await chrome.tabs.query({ groupId: parsed.id })
      if (groupTabs.length === 0) return
      groupTabs.sort((a, b) => a.index - b.index)

      if (dropTarget.insideGroupId === parsed.id) {
        // Dropping inside the group at the start
        targetIndex = groupTabs[0].index
      } else {
        // Dropping after the whole group
        targetIndex = groupTabs[groupTabs.length - 1].index + 1
      }
    }
  }

  // Adjust for the dragged tab's current position if needed
  if (draggedTab.index < targetIndex) {
    targetIndex--
  }

  // Ungroup first if needed
  if (wasInGroup && dropTarget.insideGroupId === undefined) {
    await chrome.tabs.ungroup(draggedItem.id)
  }

  // Move the tab
  await chrome.tabs.move(draggedItem.id, {
    windowId: draggedTab.windowId,
    index: Math.max(0, targetIndex),
  })

  // Add to group if needed
  if (dropTarget.insideGroupId !== undefined) {
    await chrome.tabs.group({
      tabIds: draggedItem.id,
      groupId: dropTarget.insideGroupId,
    })
  }
}

const performGroupDrop = async (
  draggedItem: DragItem,
  dropTarget: DropTarget,
): Promise<void> => {
  const groupTabs = await chrome.tabs.query({ groupId: draggedItem.id })
  if (groupTabs.length === 0) return

  groupTabs.sort((a, b) => a.index - b.index)
  const groupStartIndex = groupTabs[0].index
  const groupSize = groupTabs.length

  // Calculate target index based on what we're dropping after
  let targetIndex: number

  if (dropTarget.afterItemKey === null) {
    // Drop at the very beginning
    targetIndex = 0
  } else {
    const parsed = parseItemKey(dropTarget.afterItemKey)
    if (!parsed) return

    if (parsed.type === 'tab') {
      const afterTab = await chrome.tabs.get(parsed.id)
      if (!afterTab) return
      // Can't drop group after a tab that's inside a group
      if (afterTab.groupId !== undefined && afterTab.groupId !== -1) return
      targetIndex = afterTab.index + 1
    } else {
      // Dropping after another group - find the last tab in that group
      const otherGroupTabs = await chrome.tabs.query({ groupId: parsed.id })
      if (otherGroupTabs.length === 0) return
      otherGroupTabs.sort((a, b) => a.index - b.index)
      targetIndex = otherGroupTabs[otherGroupTabs.length - 1].index + 1
    }
  }

  // Adjust for the dragged group's current position if it's before the target
  if (groupStartIndex < targetIndex) {
    targetIndex -= groupSize
  }

  await chrome.tabGroups.move(draggedItem.id, {
    index: Math.max(0, targetIndex),
  })
}
