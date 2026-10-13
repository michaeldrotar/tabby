// @vitest-environment jsdom
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup, render, screen, within } from '@testing-library/react'
import { defaultPreferences } from '@extension/core'
import { afterEach, expect, it, vi } from 'vitest'
import { Options } from './Options'
import type { OptionsProps } from './Options'

expect.extend(matchers)
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

const renderOptions = () =>
  render(
    <Options
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

it('lists side panel position, global shortcuts, and Tab manager shortcuts in order', () => {
  const { container } = renderOptions()

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
    'Reset',
  ])
  expect(container.querySelectorAll('details')).toHaveLength(0)
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
