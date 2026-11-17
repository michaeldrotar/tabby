// @vitest-environment jsdom
import { availableSeasonalHolidays, defaultPreferences } from '@extension/core'
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import {
  OptionsSeasonalIcons,
  OptionsSeasonalIconsOverview,
} from './OptionsSeasonalIcons'

expect.extend(matchers)
afterEach(cleanup)

it('shows each holiday and its three illustrated choices plus Off', () => {
  render(
    <OptionsSeasonalIcons
      preferences={defaultPreferences}
      onPreferenceChange={vi.fn()}
    />,
  )

  expect(screen.queryByRole('group', { name: 'Summer' })).toBeNull()
  expect(screen.getAllByRole('group')).toHaveLength(
    availableSeasonalHolidays.length + 1,
  )

  for (const holiday of availableSeasonalHolidays) {
    const group = screen.getByRole('group', { name: holiday.name })
    expect(within(group).getAllByRole('radio')).toHaveLength(4)
    expect(
      within(group).getByRole('radio', {
        name: 'Off',
      }),
    ).toBeInTheDocument()
  }
})

it('offers incognito choices independently of seasonal icons', () => {
  const onPreferenceChange = vi.fn()
  const props = {
    preferences: { ...defaultPreferences, seasonalIconsEnabled: false },
    onPreferenceChange,
  }
  const { rerender } = render(<OptionsSeasonalIcons {...props} />)
  const incognito = within(screen.getByRole('group', { name: 'Incognito' }))
  expect(
    incognito
      .getAllByRole('radio')
      .map((radio) => radio.getAttribute('aria-label')),
  ).toEqual(['Ninja', 'Spy', 'Ghost', 'Classic Tabby'])
  expect(incognito.getByRole('radio', { name: 'Ninja' })).toBeChecked()
  fireEvent.click(incognito.getByRole('radio', { name: 'Spy' }))
  expect(onPreferenceChange).toHaveBeenLastCalledWith({ incognitoIcon: 'spy' })
  rerender(
    <OptionsSeasonalIcons
      {...props}
      preferences={{ ...props.preferences, incognitoIcon: 'spy' }}
    />,
  )
  expect(incognito.getByRole('radio', { name: 'Spy' })).toBeChecked()
  fireEvent.click(incognito.getByRole('radio', { name: 'Classic Tabby' }))
  expect(onPreferenceChange).toHaveBeenLastCalledWith({
    incognitoIcon: 'classic',
  })
})

it('shows changing date controls inline with their holidays', () => {
  render(
    <OptionsSeasonalIcons
      preferences={defaultPreferences}
      onPreferenceChange={vi.fn()}
    />,
  )

  const easter = screen.getByRole('group', { name: 'Easter' })
  const thanksgiving = screen.getByRole('group', {
    name: 'Thanksgiving',
  })
  expect(
    within(easter).getByRole('combobox', { name: 'Easter date' }),
  ).toHaveTextContent('Use browser region')
  expect(
    within(thanksgiving).getByRole('combobox', {
      name: 'Thanksgiving date',
    }),
  ).toHaveTextContent('Use browser region')
  expect(
    within(screen.getByRole('group', { name: "Valentine's Day" })).getByText(
      'February 14',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByText('Date varies')).toBeNull()
})

it('saves a seasonal icon choice independently', () => {
  const onPreferenceChange = vi.fn()
  render(
    <OptionsSeasonalIcons
      preferences={defaultPreferences}
      onPreferenceChange={onPreferenceChange}
    />,
  )

  const valentines = screen.getByRole('group', {
    name: "Valentine's Day",
  })
  fireEvent.click(
    within(valentines).getByRole('radio', {
      name: 'Off',
    }),
  )
  expect(onPreferenceChange).toHaveBeenCalledWith({
    seasonalIconSelections: {
      ...defaultPreferences.seasonalIconSelections,
      valentines: 'off',
    },
  })
})

it('saves the seasonal icon toggle immediately from the main list', () => {
  const onPreferenceChange = vi.fn()
  render(
    <OptionsSeasonalIconsOverview
      preferences={defaultPreferences}
      onPreferenceChange={onPreferenceChange}
      onOpen={vi.fn()}
    />,
  )

  fireEvent.click(screen.getByRole('switch', { name: 'Show seasonal icons' }))
  expect(onPreferenceChange).toHaveBeenLastCalledWith({
    seasonalIconsEnabled: false,
  })
})
