// @vitest-environment jsdom
import { defaultPreferences, SEASONAL_HOLIDAYS } from '@extension/core'
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

  expect(screen.getAllByRole('group')).toHaveLength(SEASONAL_HOLIDAYS.length)

  for (const holiday of SEASONAL_HOLIDAYS) {
    const group = screen.getByRole('group', { name: holiday.name })
    expect(within(group).getAllByRole('radio')).toHaveLength(4)
    expect(
      within(group).getByRole('radio', {
        name: /OffUse Tabby’s regular icon/,
      }),
    ).toBeInTheDocument()
  }
})

it('shows changing date controls inline with their holidays', () => {
  render(
    <OptionsSeasonalIcons
      preferences={defaultPreferences}
      onPreferenceChange={vi.fn()}
    />,
  )

  const easter = screen.getByRole('group', { name: 'Easter' })
  const thanksgiving = screen.getByRole('group', { name: 'Thanksgiving' })
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

it('saves a holiday choice independently', () => {
  const onPreferenceChange = vi.fn()
  render(
    <OptionsSeasonalIcons
      preferences={defaultPreferences}
      onPreferenceChange={onPreferenceChange}
    />,
  )

  const valentines = screen.getByRole('group', { name: "Valentine's Day" })
  fireEvent.click(
    within(valentines).getByRole('radio', {
      name: /OffUse Tabby’s regular icon/,
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
