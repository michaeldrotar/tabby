import { describe, expect, it } from 'vitest'
import { createShowcase } from './showcase'

describe('marketing showcase', () => {
  it('cleans up a selection, searches the same browser, customizes it, and restores the starting state', async () => {
    const showcase = await createShowcase()
    try {
      const { backend, preferences, views } = showcase.resources
      expect(backend.getSnapshot().tabs).toHaveLength(9)
      showcase.player.seek(2000)
      expect([
        ...views.tabManager.getState().selection.selection.tabIds,
      ]).toEqual([5, 6, 7])
      showcase.player.seek(6000)
      expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([
        1, 2, 3, 4, 8, 9,
      ])
      showcase.player.seek(8000)
      expect(showcase.navigation.getState().product).toBe('search')
      expect(views.omnibar.getState().query).toBe('design')
      expect(
        views.omnibar.getState().externalResults.map((result) => result.type),
      ).toEqual(['bookmark', 'history', 'recently-closed'])
      showcase.player.seek(14000)
      expect(preferences.getSnapshot()).toMatchObject({
        theme: 'dark',
        themeDarkAccent: 'rose',
      })
      showcase.reset()
      expect(backend.getSnapshot().tabs).toHaveLength(9)
      expect(preferences.getSnapshot().theme).toBe('light')
      expect(views.omnibar.getState().query).toBe('')
      expect(showcase.navigation.getState().product).toBe('manager')
    } finally {
      showcase.dispose()
    }
  })
})
