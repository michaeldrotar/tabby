import { useDragAndDrop, makeItemKey } from './useDragAndDrop'
import { createContext, useContext } from 'react'
import type { DragItem, DropTarget } from './useDragAndDrop'
import type { DragEvent, ReactNode } from 'react'

export type DragDropContextValue = {
  draggedItem: DragItem | null
  dropTarget: DropTarget | null
  handleDragStart: (e: DragEvent, item: DragItem) => void
  handleDragEnd: () => void
  handleDragOver: (
    e: DragEvent,
    itemKey: string,
    prevItemKey: string | null,
    insideGroupId?: number,
    prevInsideGroupId?: number,
  ) => void
  handleDragEnter: (e: DragEvent) => void
  handleDragLeave: (e: DragEvent) => void
  handleDrop: (e: DragEvent) => Promise<void>
  /**
   * Check if the drop indicator should appear after a given item.
   * Also pass the next item key to help detect if this is the dragged item's current position.
   */
  shouldShowIndicatorAfter: (itemKey: string, nextItemKey?: string) => boolean
  /**
   * Check if the drop indicator should appear at the start (before first item)
   */
  shouldShowIndicatorAtStart: (firstItemKey?: string) => boolean
}

const DragDropContext = createContext<DragDropContextValue | null>(null)

export const DragDropProvider = ({ children }: { children: ReactNode }) => {
  const dragDrop = useDragAndDrop()

  const shouldShowIndicatorAfter = (
    itemKey: string,
    nextItemKey?: string,
  ): boolean => {
    if (!dragDrop.dropTarget || !dragDrop.draggedItem) return false

    const draggedKey = makeItemKey(
      dragDrop.draggedItem.type,
      dragDrop.draggedItem.id,
    )

    // Don't show indicator on the dragged item itself
    if (itemKey === draggedKey) return false

    // Check if this is the drop target position
    if (dragDrop.dropTarget.afterItemKey !== itemKey) return false

    // Don't show indicator if the next item is the dragged item
    // (this would mean we're showing the indicator at its current position)
    if (nextItemKey === draggedKey) return false

    return true
  }

  const shouldShowIndicatorAtStart = (firstItemKey?: string): boolean => {
    if (!dragDrop.dropTarget || !dragDrop.draggedItem) return false
    if (dragDrop.dropTarget.afterItemKey !== null) return false

    // Don't show at start if the first item is the dragged item
    const draggedKey = makeItemKey(
      dragDrop.draggedItem.type,
      dragDrop.draggedItem.id,
    )
    if (firstItemKey === draggedKey) return false

    return true
  }

  return (
    <DragDropContext.Provider
      value={{
        ...dragDrop,
        shouldShowIndicatorAfter,
        shouldShowIndicatorAtStart,
      }}
    >
      {children}
    </DragDropContext.Provider>
  )
}

export const useDragDropContext = (): DragDropContextValue => {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDropContext must be used within a DragDropProvider')
  }
  return context
}

// Re-export utilities
export { makeItemKey } from './useDragAndDrop'
export type { DragItem, DragItemType, DropTarget } from './useDragAndDrop'
