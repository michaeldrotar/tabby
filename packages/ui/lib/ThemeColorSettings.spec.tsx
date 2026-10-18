// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { defaultPreferences } from '@extension/core'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ThemeColorSettings } from './ThemeColorSettings'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('edits the selected theme through compact and Settings controls', () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  const change = vi.fn()
  const { rerender } = render(
    <ThemeColorSettings
      preferences={defaultPreferences}
      activeThemeMode="light"
      onPreferenceChange={change}
      compact
    />,
  )
  expect(
    screen.queryByRole('button', { name: 'System' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Light' }))
  expect(change).toHaveBeenLastCalledWith({ theme: 'light' })
  fireEvent.click(screen.getByRole('radio', { name: 'Violet' }))
  expect(change).toHaveBeenLastCalledWith({ themeLightAccent: 'violet' })
  fireEvent.change(screen.getByRole('slider', { name: 'Accent strength' }), {
    target: { value: '30' },
  })
  expect(change).toHaveBeenLastCalledWith({ themeLightAccentStrength: 30 })

  rerender(
    <ThemeColorSettings
      preferences={defaultPreferences}
      activeThemeMode="dark"
      onPreferenceChange={change}
    />,
  )
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Background' }), {
    key: 'ArrowUp',
  })
  expect(change).toHaveBeenLastCalledWith({ themeDarkBackground: 'zinc' })
})
