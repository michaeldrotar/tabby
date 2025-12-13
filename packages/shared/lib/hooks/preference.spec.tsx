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
  document.body.removeAttribute('data-theme-background')
  document.body.removeAttribute('data-theme-foreground')
  document.body.removeAttribute('data-theme-accent')
})

describe('useThemeApplicator', () => {
  it('applies data-theme="dark" when theme is system and system prefers dark', async () => {
    const matchMedia = createMatchMediaMock(true)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({
          theme: 'system',
          themeLightBackground: 'stone',
          themeLightForeground: 'neutral',
          themeLightAccent: 'amber',
          themeDarkBackground: 'neutral',
          themeDarkForeground: 'zinc',
          themeDarkAccent: 'blue',
        }),
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
    expect(document.body.getAttribute('data-theme-background')).toBe('neutral')
    expect(document.body.getAttribute('data-theme-foreground')).toBe('zinc')
    expect(document.body.getAttribute('data-theme-accent')).toBe('blue')
  })

  it('applies data-theme="light" when theme is system and system prefers light', async () => {
    const matchMedia = createMatchMediaMock(false)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({
          theme: 'system',
          themeLightBackground: 'stone',
          themeLightForeground: 'neutral',
          themeLightAccent: 'amber',
          themeDarkBackground: 'neutral',
          themeDarkForeground: 'zinc',
          themeDarkAccent: 'blue',
        }),
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

    expect(document.body.getAttribute('data-theme')).toBe('light')
    expect(document.body.getAttribute('data-theme-background')).toBe('stone')
    expect(document.body.getAttribute('data-theme-foreground')).toBe('neutral')
    expect(document.body.getAttribute('data-theme-accent')).toBe('amber')
  })

  it('keeps system theme in sync with prefers-color-scheme changes', async () => {
    const matchMedia = createMatchMediaMock(true)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({
          theme: 'system',
          themeLightBackground: 'stone',
          themeLightForeground: 'neutral',
          themeLightAccent: 'amber',
          themeDarkBackground: 'neutral',
          themeDarkForeground: 'zinc',
          themeDarkAccent: 'blue',
        }),
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
    expect(document.body.getAttribute('data-theme-background')).toBe('neutral')
    expect(document.body.getAttribute('data-theme-foreground')).toBe('zinc')
    expect(document.body.getAttribute('data-theme-accent')).toBe('blue')

    matchMedia.dispatchChange(false)
    expect(document.body.getAttribute('data-theme')).toBe('light')
    expect(document.body.getAttribute('data-theme-background')).toBe('stone')
    expect(document.body.getAttribute('data-theme-foreground')).toBe('neutral')
    expect(document.body.getAttribute('data-theme-accent')).toBe('amber')

    matchMedia.dispatchChange(true)
    expect(document.body.getAttribute('data-theme')).toBe('dark')
    expect(document.body.getAttribute('data-theme-background')).toBe('neutral')
    expect(document.body.getAttribute('data-theme-foreground')).toBe('zinc')
    expect(document.body.getAttribute('data-theme-accent')).toBe('blue')
  })

  it('sets data-theme palettes when present in preferences', async () => {
    const matchMedia = createMatchMediaMock(false)

    vi.doMock('./use-storage.js', () => {
      return {
        useStorage: () => ({
          theme: 'dark',
          themeLightBackground: 'stone',
          themeLightForeground: 'neutral',
          themeLightAccent: 'amber',
          themeDarkBackground: 'slate',
          themeDarkForeground: 'zinc',
          themeDarkAccent: 'blue',
        }),
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
    expect(document.body.getAttribute('data-theme-background')).toBe('slate')
    expect(document.body.getAttribute('data-theme-foreground')).toBe('zinc')
    expect(document.body.getAttribute('data-theme-accent')).toBe('blue')
  })
})
