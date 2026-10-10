// @vitest-environment jsdom
import { createTabbyViews, useTabbyResources } from '@extension/app'
import { createMemoryTabbyData } from '@extension/demo'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryTabbyProvider } from './MemoryTabbyProvider'
import type { TabbyResources } from '@extension/app'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('complete memory provider', () => {
  it('keeps complete defaults across equivalent props and swaps scenes without retaining owned view state', async () => {
    let current!: TabbyResources
    const Read = () => {
      const resources = useTabbyResources()
      useEffect(() => {
        current = resources
      }, [resources])
      return (
        <span>{resources.backend.getSnapshot().windows.length} windows</span>
      )
    }
    const { rerender } = render(
      <MemoryTabbyProvider
        scene="single-window"
        preferences={{ theme: 'dark' }}
      >
        <Read />
      </MemoryTabbyProvider>,
    )
    expect(screen.getByText('1 windows')).toBeDefined()
    expect(current.preferences.getSnapshot().theme).toBe('dark')
    expect(current.omnibar.getSnapshot().loaded).toBe(true)
    expect(current.options.getSnapshot().status).toBe('ready')
    const first = current.backend
    const dispose = vi.spyOn(first, 'dispose')
    await act(() =>
      first.execute({ type: 'create-tab', url: 'https://demo.test/new' }),
    )
    const count = first.getSnapshot().tabs.length
    rerender(
      <MemoryTabbyProvider
        scene="single-window"
        preferences={{ theme: 'dark' }}
      >
        <Read />
      </MemoryTabbyProvider>,
    )
    expect(current.backend).toBe(first)
    expect(current.backend.getSnapshot().tabs).toHaveLength(count)
    current.views.omnibar.setState({ query: 'custom query' })
    rerender(
      <MemoryTabbyProvider scene="many-windows">
        <Read />
      </MemoryTabbyProvider>,
    )
    expect(current.backend).not.toBe(first)
    expect(current.backend.getSnapshot().windows.length).toBeGreaterThan(1)
    expect(current.views.omnibar.getState().query).toBe('')
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('preserves edited browser data and independent views when preferences, one view, or callbacks change', async () => {
    let current!: TabbyResources
    const Read = () => {
      const resources = useTabbyResources()
      useEffect(() => {
        current = resources
      }, [resources])
      return null
    }
    const { rerender } = render(
      <MemoryTabbyProvider>
        <Read />
      </MemoryTabbyProvider>,
    )
    const backend = current.backend
    const dispose = vi.spyOn(backend, 'dispose')
    await act(() =>
      backend.execute({ type: 'create-tab', url: 'https://demo.test/edit' }),
    )
    const count = backend.getSnapshot().tabs.length
    const omnibarView = current.views.omnibar
    omnibarView.setState({ query: 'Preserved query' })
    rerender(
      <MemoryTabbyProvider
        preferences={{ theme: 'dark' }}
        views={{ options: createTabbyViews().options }}
        optionsHost={{ openShortcutsSettings: async () => {} }}
      >
        <Read />
      </MemoryTabbyProvider>,
    )
    expect(current.backend).toBe(backend)
    expect(backend.getSnapshot().tabs).toHaveLength(count)
    expect(current.views.omnibar).toBe(omnibarView)
    expect(current.views.omnibar.getState().query).toBe('Preserved query')
    expect(current.preferences.getSnapshot().theme).toBe('dark')
    expect(dispose).not.toHaveBeenCalled()
  })

  it('advances the default demo clock and schedules live callbacks', () => {
    vi.useFakeTimers()
    let current!: TabbyResources
    const Read = () => {
      const resources = useTabbyResources()
      useEffect(() => {
        current = resources
      }, [resources])
      return null
    }
    render(
      <MemoryTabbyProvider>
        <Read />
      </MemoryTabbyProvider>,
    )
    const started = current.environment.now()
    const callback = vi.fn()
    const cancel = current.environment.schedule!(callback, 250)
    act(() => vi.advanceTimersByTime(250))
    expect(current.environment.now()).toBe(started + 250)
    expect(callback).toHaveBeenCalledOnce()
    const cancelled = vi.fn()
    const cancelPending = current.environment.schedule!(cancelled, 250)
    cancelPending()
    act(() => vi.advanceTimersByTime(250))
    expect(cancelled).not.toHaveBeenCalled()
    cancel()
  })

  it('leaves shared resource lifecycle and supplied view state with their external owner', () => {
    const data = createMemoryTabbyData()
    const lifecycle = Object.values(data).map((resource) => ({
      start: vi.spyOn(resource, 'start'),
      dispose: vi.spyOn(resource, 'dispose'),
    }))
    let current!: TabbyResources
    const Read = () => {
      const resources = useTabbyResources()
      useEffect(() => {
        current = resources
      }, [resources])
      return null
    }
    const views = createTabbyViews()
    views.tabManager.setState({ viewedWindowId: 42 })
    views.omnibar.setState({ query: 'Shared query' })
    const { unmount, rerender } = render(
      <MemoryTabbyProvider resources={data} views={views}>
        <Read />
      </MemoryTabbyProvider>,
    )
    expect(current.views.tabManager.getState().viewedWindowId).toBe(42)
    rerender(
      <MemoryTabbyProvider
        scene="many-windows"
        resources={{ ...data }}
        views={{ ...views }}
      >
        <Read />
      </MemoryTabbyProvider>,
    )
    expect(current.views.omnibar.getState().query).toBe('Shared query')
    expect(current.backend).toBe(data.backend)
    expect(current.preferences).toBe(data.preferences)
    unmount()
    lifecycle.forEach(({ start, dispose }) => {
      expect(start).not.toHaveBeenCalled()
      expect(dispose).not.toHaveBeenCalled()
    })
  })
})
