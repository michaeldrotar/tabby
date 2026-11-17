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
import { useState } from 'react'
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
    id: 'open-tab-manager',
    name: 'Open tab manager',
    description: 'Opens the side panel',
  },
]

const renderOptions = (
  hash = '',
  onPreferenceChange: OptionsProps['onPreferenceChange'] = vi.fn(),
  isMac = false,
) => {
  window.history.replaceState(null, '', `/${hash}`)
  const LiveOptions = () => {
    const [preferences, setPreferences] = useState(defaultPreferences)
    return (
      <Options
        urlSeasonalIcons
        preferences={preferences}
        activeThemeMode="light"
        isMac={isMac}
        shortcutRows={shortcutRows}
        logoUrl=""
        onPreferenceChange={(patch) => {
          onPreferenceChange(patch)
          setPreferences((current) => ({ ...current, ...patch }))
        }}
        openShortcutsSettings={vi.fn()}
        openSidePanelSettings={vi.fn()}
      />
    )
  }
  return render(<LiveOptions />)
}

it('keeps options in a flat list ending with seasonal icons', () => {
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
  ])
  expect(screen.queryByRole('group', { name: "Valentine's Day" })).toBeNull()
  const identification = screen.getByRole('combobox', {
    name: 'Window identification',
  })
  expect(identification).toHaveTextContent('Active tab')
  expect(
    identification.compareDocumentPosition(
      screen.getByRole('combobox', { name: 'Window focus' }),
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(
    screen.getByRole('switch', { name: 'Show seasonal icons' }),
  ).toBeChecked()
})

it('updates the focus setting and its shortcut explanation together', () => {
  const save = vi.fn()
  renderOptions('', save)
  const description = screen.getByText(
    'Choose whether picking a window or moving tabs and groups switches windows. Hold Shift to do the opposite.',
  )
  expect(description).toBeVisible()
  expect(
    screen.getByText(
      'Hold while choosing a move destination or dropping tabs to switch windows',
    ),
  ).toBeVisible()
  fireEvent.click(screen.getByRole('combobox', { name: 'Window focus' }))
  fireEvent.click(screen.getByRole('option', { name: 'Switch windows' }))
  expect(save).toHaveBeenLastCalledWith({
    tabManagerWindowClickBehavior: 'switch',
  })
  expect(
    screen.getByText(
      'Hold while choosing a move destination or dropping tabs to stay in this window',
    ),
  ).toBeVisible()
  expect(
    screen.queryByText(
      'Hold while choosing a move destination or dropping tabs to switch windows',
    ),
  ).toBeNull()
  expect(description).toBeVisible()
  expect(screen.queryByText(/Command-click|Ctrl-click/)).toBeNull()
})

it('lets users enable and disable window stacking independently of window focus', () => {
  const save = vi.fn()
  renderOptions('', save)
  const stacking = screen.getByRole('combobox', { name: 'Stack windows' })
  expect(stacking).toHaveTextContent('Off')
  fireEvent.click(stacking)
  fireEvent.click(screen.getByRole('option', { name: 'On' }))
  expect(save).toHaveBeenLastCalledWith({ stackWindows: true })
  expect(
    screen.getByRole('combobox', { name: 'Window focus' }),
  ).toHaveTextContent('Stay in this window')
  fireEvent.click(stacking)
  fireEvent.click(screen.getByRole('option', { name: 'Off' }))
  expect(save).toHaveBeenLastCalledWith({ stackWindows: false })
})

it('opens seasonal choices at a direct link and returns to the main list', () => {
  renderOptions()
  fireEvent.click(screen.getByRole('button', { name: 'Choose seasonal icons' }))

  expect(window.location.hash).toBe('#seasonal-icons')
  expect(screen.getByRole('group', { name: "Valentine's Day" })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Back to options' }))

  expect(window.location.hash).toBe('')
  expect(screen.getByRole('heading', { name: 'Appearance' })).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Reset options' })).toBeNull()
  expect(screen.queryByRole('group', { name: "Valentine's Day" })).toBeNull()
})

it('opens directly to the seasonal choices from a shared link', () => {
  renderOptions('#seasonal-icons')

  expect(screen.getByRole('group', { name: 'Halloween' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Back to options' })).toBeVisible()
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
