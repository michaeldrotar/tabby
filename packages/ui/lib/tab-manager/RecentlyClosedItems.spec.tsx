// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { RecentlyClosedItems } from './RecentlyClosedItems'

afterEach(cleanup)

it('explains loading, empty, and error states and offers a retry', () => {
  const onRefresh = vi.fn()
  const props = {
    onRefresh,
    onRestore: vi.fn(),
    formatClosedAt: () => 'Oct 25, 5:00 PM',
  }
  const { rerender } = render(
    <RecentlyClosedItems
      {...props}
      snapshot={{ status: 'loading', sessions: [] }}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading recently closed items',
  )
  rerender(
    <RecentlyClosedItems
      {...props}
      snapshot={{ status: 'ready', sessions: [] }}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'No recently closed items available',
  )
  expect(screen.getByText(/25 closed tabs and windows combined/)).toBeVisible()
  rerender(
    <RecentlyClosedItems
      {...props}
      snapshot={{
        status: 'error',
        sessions: [],
        error: 'Could not load windows.',
      }}
    />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load windows.')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(onRefresh).toHaveBeenCalledOnce()
})
