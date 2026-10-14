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
import { OptionsSeasonalIcons } from './OptionsSeasonalIcons'

expect.extend(matchers)
afterEach(cleanup)

it('shows each holiday and its three illustrated choices plus Off', () => {
  render(
    <OptionsSeasonalIcons
      preferences={defaultPreferences}
      onPreferenceChange={vi.fn()}
    />,
  )

  expect(
    screen.getByRole('switch', { name: 'Show seasonal icons' }),
  ).toBeChecked()
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

it('saves a holiday choice independently and pauses all seasonal icons', () => {
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

  fireEvent.click(screen.getByRole('switch', { name: 'Show seasonal icons' }))
  expect(onPreferenceChange).toHaveBeenLastCalledWith({
    seasonalIconsEnabled: false,
  })
})
