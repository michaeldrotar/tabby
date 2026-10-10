// @vitest-environment jsdom
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Omnibar } from './Omnibar'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

expect.extend(matchers)

const createLocalhostTabs = (): OmnibarSearchResult[] =>
  [
    { id: 1, title: 'Project One', windowId: 2, tabId: 1 },
    { id: 2, title: 'Project Two', windowId: 3, tabId: 2 },
    { id: 3, title: 'Project Three', windowId: 4, tabId: 3 },
  ].map((tab) => ({
    ...tab,
    type: 'tab',
    url: 'http://localhost:3000',
    execute: vi.fn().mockResolvedValue(undefined),
  }))

describe('Omnibar modifier actions', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(cleanup)

  const renderOmnibar = (tabs: OmnibarSearchResult[]) => {
    const onDismiss = vi.fn()

    render(
      <Omnibar results={tabs} onDismiss={onDismiss} originalWindowId={1} />,
    )
  }

  const searchLocalhostTabs = async () => {
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'localhost' } })
    const list = await screen.findByRole('list')
    return { input, list }
  }

  it('routes keyboard new-tab actions for localhost results', async () => {
    const tabs = createLocalhostTabs()
    renderOmnibar(tabs)

    const { input, list } = await searchLocalhostTabs()
    const projectTwo = within(list).getByRole('button', {
      name: /Project Two/,
    })
    fireEvent.mouseMove(projectTwo)
    fireEvent.keyDown(input, { key: 'Control' })

    expect(projectTwo).toHaveTextContent('Open in New Tab')
    expect(projectTwo).not.toHaveTextContent('Jump to')

    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })

    await waitFor(() =>
      expect(tabs[1]!.execute).toHaveBeenCalledWith('new-tab', 1),
    )
  })

  it('preserves Shift precedence and updates the keyboard action hint', async () => {
    const tabs = createLocalhostTabs()
    renderOmnibar(tabs)

    const { input, list } = await searchLocalhostTabs()
    const projectThree = within(list).getByRole('button', {
      name: /Project Three/,
    })
    fireEvent.mouseMove(projectThree)
    fireEvent.keyDown(input, { key: 'Control' })
    fireEvent.keyDown(input, { key: 'Shift', ctrlKey: true })

    expect(projectThree).toHaveTextContent('Open in New Window')

    fireEvent.keyDown(input, {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
    })

    await waitFor(() =>
      expect(tabs[2]!.execute).toHaveBeenCalledWith('new-window', 1),
    )
  })

  it('routes modifier-clicks to the clicked localhost result', async () => {
    const tabs = createLocalhostTabs()
    renderOmnibar(tabs)

    const { list } = await searchLocalhostTabs()
    const projectOne = within(list).getByRole('button', { name: /Project One/ })
    const projectThree = within(list).getByRole('button', {
      name: /Project Three/,
    })

    fireEvent.click(projectOne, { metaKey: true })
    await waitFor(() =>
      expect(tabs[0]!.execute).toHaveBeenCalledWith('new-tab', 1),
    )

    fireEvent.click(projectThree, { shiftKey: true })
    await waitFor(() =>
      expect(tabs[2]!.execute).toHaveBeenCalledWith('new-window', 1),
    )
  })
})
