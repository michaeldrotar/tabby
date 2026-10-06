export type { SelectionMode, SelectionState } from './SelectionStore'
export { useSelectionStore } from './SelectionStore'
export { useSelection } from './useSelection'
export { useSelectionActions } from './useSelectionActions'
export type {
  PaneContext,
  SelectionItemRef,
  SelectionItemType,
} from './useSelectionInteraction'
export {
  clearAnchorIfRemoved,
  useSelectionInteraction,
} from './useSelectionInteraction'
export { useSelectionSync } from './useSelectionSync'

// Animation components
export { ModeTransitionEffect } from './ModeTransitionEffect'
export { SelectionFocusRing } from './SelectionFocusRing'
export type { ModeTransitionPhase } from './useSelectionModeAnimation'
export { useSelectionModeAnimation } from './useSelectionModeAnimation'
