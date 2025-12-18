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
    const onRemove = vi.fn()

    render(
      <TabItem
        label="My Tab"
        iconUrl="https://example.com/favicon.ico"
        isActive={false}
        isDiscarded={false}
        isHighlighted={false}
        onActivate={onActivate}
        onRemove={onRemove}
        data-testid="tab-item"
      />,
    )

    const element = screen.getByTestId('tab-item')
    expect(element).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /My Tab/i })
    expect(button).toBeInTheDocument()

    const img = screen.getByAltText('')
    expect(img).toHaveAttribute('src', 'https://example.com/favicon.ico')
  })

  it('calls handlers on clicks', () => {
    const onActivate = vi.fn()
    const onRemove = vi.fn()

    render(
      <TabItem
        label="Main Tab"
        iconUrl="/favicon.ico"
        isActive={false}
        isDiscarded={false}
        isHighlighted={false}
        onActivate={onActivate}
        onRemove={onRemove}
      />,
    )

    const mainBtn = screen.getByRole('button', { name: /Main Tab/i })
    fireEvent.click(mainBtn)
    expect(onActivate).toHaveBeenCalled()

    const closeBtn = screen.getByTitle('Close Tab')
    fireEvent.click(closeBtn)
    expect(onRemove).toHaveBeenCalled()
  })
})
