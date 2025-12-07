// @vitest-environment jsdom
import { TabItem } from './TabItem'
import * as matchers from '@testing-library/jest-dom/matchers'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

expect.extend(matchers)

describe('TabItem', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders label, icon and data attribute', () => {
    const onActivate = vi.fn()
    const onRefresh = vi.fn()
    const onRemove = vi.fn()

    render(
      <TabItem
        tabId={42}
        label="My Tab"
        iconUrl="https://example.com/favicon.ico"
        isActive={false}
        isDiscarded={false}
        isHighlighted={false}
        onActivate={onActivate}
        onRefresh={onRefresh}
        onRemove={onRemove}
      />,
    )

    const button = screen.getByRole('button', { name: /My Tab/i })
    expect(button).toHaveAttribute('data-tab-button', '42')

    const img = screen.getByAltText('')
    expect(img).toHaveAttribute('src', 'https://example.com/favicon.ico')
  })

  it('calls handlers on clicks', () => {
    const onActivate = vi.fn()
    const onRefresh = vi.fn()
    const onRemove = vi.fn()

    render(
      <TabItem
        tabId={99}
        label="Main Tab"
        iconUrl="/favicon.ico"
        isActive={false}
        isDiscarded={false}
        isHighlighted={false}
        onActivate={onActivate}
        onRefresh={onRefresh}
        onRemove={onRemove}
      />,
    )

    // Click the main button
    const mainBtn = screen.getByRole('button', { name: /Main Tab/i })
    fireEvent.click(mainBtn)
    expect(onActivate).toHaveBeenCalled()

    // Click refresh and close buttons via titles
    const refreshBtn = screen.getByTitle('Refresh Tab')
    const closeBtn = screen.getByTitle('Close Tab')

    fireEvent.click(refreshBtn)
    expect(onRefresh).toHaveBeenCalled()

    fireEvent.click(closeBtn)
    expect(onRemove).toHaveBeenCalled()
  })
})
