// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type MatchMediaMock = {
  matches: boolean
  addEventListener: (
    type: 'change',
    listener: (event?: unknown) => void,
  ) => void
  removeEventListener: (
    type: 'change',
    listener: (event?: unknown) => void,
  ) => void
  dispatchChange: (matches: boolean) => void
}

const createMatchMediaMock = (initialMatches: boolean): MatchMediaMock => {
  let matches = initialMatches
  const listeners = new Set<(event?: unknown) => void>()

  return {
    get matches() {
      return matches
    },
    addEventListener: (_type, listener) => {
      listeners.add(listener)
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener)
    },
    dispatchChange: (nextMatches) => {
      matches = nextMatches
      for (const listener of listeners) listener()
    },
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  document.body.removeAttribute('data-theme')
})

describe('useThemeApplicator', () => {
  it('applies data-theme="dark" when theme is unset and system prefers dark', async () => {
    const matchMedia = createMatchMediaMock(true)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({ theme: undefined }),
      }
    })

    vi.doMock('@extension/storage', () => {
      return {
        preferenceStorage: {},
      }
    })

    const { useThemeApplicator } = await import('./preference.js')

    ;(window as unknown as { matchMedia: () => MediaQueryList }).matchMedia =
      () => matchMedia as unknown as MediaQueryList

    const Test = () => {
      useThemeApplicator()
      return null
    }

    render(<Test />)

    expect(document.body.getAttribute('data-theme')).toBe('dark')
  })

  it('removes data-theme when theme is unset and system prefers light', async () => {
    const matchMedia = createMatchMediaMock(false)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({ theme: undefined }),
      }
    })

    vi.doMock('@extension/storage', () => {
      return {
        preferenceStorage: {},
      }
    })

    const { useThemeApplicator } = await import('./preference.js')

    ;(window as unknown as { matchMedia: () => MediaQueryList }).matchMedia =
      () => matchMedia as unknown as MediaQueryList

    document.body.setAttribute('data-theme', 'dark')

    const Test = () => {
      useThemeApplicator()
      return null
    }

    render(<Test />)

    expect(document.body.hasAttribute('data-theme')).toBe(false)
  })

  it('keeps fallback in sync with prefers-color-scheme changes until a theme is set', async () => {
    const matchMedia = createMatchMediaMock(true)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({ theme: undefined }),
      }
    })

    vi.doMock('@extension/storage', () => {
      return {
        preferenceStorage: {},
      }
    })

    const { useThemeApplicator } = await import('./preference.js')

    ;(window as unknown as { matchMedia: () => MediaQueryList }).matchMedia =
      () => matchMedia as unknown as MediaQueryList

    const Test = () => {
      useThemeApplicator()
      return null
    }

    render(<Test />)
    expect(document.body.getAttribute('data-theme')).toBe('dark')

    matchMedia.dispatchChange(false)
    expect(document.body.hasAttribute('data-theme')).toBe(false)

    matchMedia.dispatchChange(true)
    expect(document.body.getAttribute('data-theme')).toBe('dark')
  })
})
