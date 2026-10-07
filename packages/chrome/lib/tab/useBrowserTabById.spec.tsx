// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { Profiler as ReactProfiler } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBrowserStore } from '../useBrowserStore.js'
import { useBrowserTabById } from './useBrowserTabById.js'
import type { BrowserTab } from './BrowserTab.js'
import type { ProfilerOnRenderCallback } from 'react'

const makeTab = (id: number, title: string): BrowserTab =>
  ({
    id,
    windowId: 1,
    index: id,
    title,
    url: `https://example.com/${id}`,
    lifecycle: 'loaded',
  }) as BrowserTab

const TabProbe = ({ id }: { id: number }) => {
  const tab = useBrowserTabById(id)
  return <span>{tab?.title}</span>
}

describe('useBrowserTabById render isolation', () => {
  beforeEach(() => {
    useBrowserStore.setState({
      tabById: {
        1: makeTab(1, 'One'),
        2: makeTab(2, 'Two'),
      },
    })
  })

  it('rerenders for its tab changes and ignores unrelated tab changes', () => {
    const commits: string[] = []
    const onRender: ProfilerOnRenderCallback = (id, phase) => {
      commits.push(`${id}:${phase}`)
    }
    const view = render(
      <ReactProfiler id="TabProbe" onRender={onRender}>
        <TabProbe id={1} />
      </ReactProfiler>,
    )
    const initialCommits = commits.length

    act(() => {
      useBrowserStore.getState().updateTabById(2, { title: 'Two updated' })
    })
    expect(commits).toHaveLength(initialCommits)

    act(() => {
      useBrowserStore.getState().updateTabById(1, { title: 'One updated' })
    })
    expect(commits).toHaveLength(initialCommits + 1)
    view.unmount()
  })
})
