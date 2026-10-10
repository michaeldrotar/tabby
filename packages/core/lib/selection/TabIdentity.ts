type TabIdentity = { id: number; renderKey?: number }

export const findTabIdReplacements = (
  previousTabs: readonly TabIdentity[],
  currentTabs: readonly TabIdentity[],
): Map<number, number> => {
  const currentIds = new Set(currentTabs.map((tab) => tab.id))
  const currentIdsByRenderKey = new Map(
    currentTabs.map((tab) => [tab.renderKey ?? tab.id, tab.id]),
  )
  const replacements = new Map<number, number>()

  for (const previousTab of previousTabs) {
    if (currentIds.has(previousTab.id)) continue
    const replacementId = currentIdsByRenderKey.get(
      previousTab.renderKey ?? previousTab.id,
    )
    if (replacementId !== undefined && replacementId !== previousTab.id) {
      replacements.set(previousTab.id, replacementId)
    }
  }

  return replacements
}

export const remapSelectedTabIds = (
  selectedIds: ReadonlySet<number>,
  replacements: ReadonlyMap<number, number>,
): Set<number> => {
  const remappedIds = new Set(selectedIds)
  for (const [previousId, currentId] of replacements) {
    if (remappedIds.delete(previousId)) remappedIds.add(currentId)
  }
  return remappedIds
}
