import { WINDOW_ICON_COMPONENTS } from '@extension/core/windowIcons'
import { icons } from 'lucide-react'
import { expect, it } from 'vitest'

it('offers the complete Lucide catalog with renderable components', () => {
  expect([...new Set(Object.values(WINDOW_ICON_COMPONENTS))].sort()).toEqual(
    Object.keys(icons).sort(),
  )
  expect(WINDOW_ICON_COMPONENTS.book).toBe('BookOpen')
})
