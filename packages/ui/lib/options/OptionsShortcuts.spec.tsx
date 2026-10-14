// @vitest-environment jsdom
import { defaultPreferences } from '@extension/core'
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { Options } from './Options'
import type { OptionsProps } from './Options'

expect.extend(matchers)
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(cleanup)

const shortcutRows: OptionsProps['shortcutRows'] = [
  {
    id: 'open-omnibar',
    name: 'Open Tabby search',
    description: 'Opens search',
    shortcut: 'Alt+E',
  },
  {
    id: 'focus-window-01',
    name: 'Focus window 1',
    description: 'Focuses the first window',
  },
]

const renderOptions = (hash = '') => {
  window.history.replaceState(null, '', `/${hash}`)
  return render(
    <Options
      urlSeasonalIcons
      preferences={defaultPreferences}
      activeThemeMode="light"
      isMac={false}
      shortcutRows={shortcutRows}
      logoUrl=""
      onPreferenceChange={vi.fn()}
      randomizeColors={vi.fn()}
      resetPreferences={vi.fn()}
      openShortcutsSettings={vi.fn()}
      openSidePanelSettings={vi.fn()}
    />,
  )
}

it('keeps settings in a flat list with seasonal icons before reset', () => {
  renderOptions()

  expect(
    screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent?.trim()),
  ).toEqual([
    'Appearance',
    'Tab manager',
    'Side panel position',
    'Global shortcuts',
    'Tab manager shortcuts',
    'Seasonal icons',
    'Reset',
  ])
  expect(screen.queryByRole('group', { name: "Valentine's Day" })).toBeNull()
  expect(
    screen.getByRole('switch', { name: 'Show seasonal icons' }),
  ).toBeChecked()
})

it('opens seasonal choices at a direct link and returns to the main list', () => {
  renderOptions()
  fireEvent.click(screen.getByRole('button', { name: 'Choose holiday icons' }))

  expect(window.location.hash).toBe('#seasonal-icons')
  expect(screen.getByRole('group', { name: "Valentine's Day" })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Back to settings' }))

  expect(window.location.hash).toBe('')
  expect(screen.getByRole('heading', { name: 'Appearance' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Reset' })).toBeVisible()
  expect(screen.queryByRole('group', { name: "Valentine's Day" })).toBeNull()
})

it('opens directly to the seasonal choices from a shared link', () => {
  renderOptions('#seasonal-icons')

  expect(screen.getByRole('group', { name: 'Halloween' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Back to settings' })).toBeVisible()
})

it('groups shared modifiers and distinguishes unassigned global shortcuts', () => {
  renderOptions()

  const globalShortcuts = screen.getByRole('region', {
    name: 'Global shortcuts',
  })
  const tabManagerShortcuts = screen.getByRole('region', {
    name: 'Tab manager shortcuts',
  })

  expect(
    within(tabManagerShortcuts).getByText('Shift+↑/↓', { selector: 'kbd' }),
  ).toBeInTheDocument()
  expect(
    within(tabManagerShortcuts).getByText('Alt+↑/↓', { selector: 'kbd' }),
  ).toBeInTheDocument()
  expect(
    within(tabManagerShortcuts).getByText('Delete / Backspace', {
      selector: 'kbd',
    }),
  ).toBeInTheDocument()

  const assigned = within(globalShortcuts).getByText('Alt+E', {
    selector: 'kbd',
  })
  const unassigned = within(globalShortcuts).getByText('Not assigned')
  expect(assigned).toHaveAttribute('data-slot', 'kbd')
  expect(unassigned).toHaveClass('text-muted')
  expect(unassigned.closest('kbd')).toBeNull()
})
