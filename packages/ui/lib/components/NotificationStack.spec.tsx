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
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationStack } from './NotificationStack'

vi.mock('../useShouldReduceMotion', () => ({
  useShouldSettleMotion: () => true,
  useShouldReduceMotion: () => true,
}))
expect.extend(matchers)
afterEach(cleanup)

const Example = ({ name }: { name: string }) => {
  const actions = useRef<HTMLButtonElement>(null)
  const [items, setItems] = useState([
    { id: 2, message: `${name} duplicated` },
    { id: 1, message: `${name} reloaded` },
  ])
  const [expanded, setExpanded] = useState(false)
  return (
    <section aria-label={name}>
      <NotificationStack
        items={items}
        expanded={expanded}
        onExpand={setExpanded}
        onDismiss={(id) =>
          setItems((items) => items.filter((entry) => entry.id !== id))
        }
        onEmptyFocus={() => actions.current?.focus()}
      />
      <button ref={actions} type="button">
        More actions
      </button>
    </section>
  )
}

describe('NotificationStack', () => {
  it('moves dismissal focus through the stack and restores the owning action bar after the last message', async () => {
    render(<Example name="Owner" />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Dismiss notification' }),
      ).toHaveFocus(),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'More actions' }),
      ).toHaveFocus(),
    )
  })
  it('expands readable selectable messages and dismisses an individual message without affecting another instance', async () => {
    render(
      <>
        <Example name="Left" />
        <Example name="Right" />
      </>,
    )
    const left = within(screen.getByRole('region', { name: 'Left' })),
      right = within(screen.getByRole('region', { name: 'Right' }))
    expect(
      left.getAllByRole('button', { name: 'Dismiss notification' }),
    ).toHaveLength(1)
    fireEvent.mouseEnter(left.getByRole('list'))
    expect(
      left.getAllByRole('button', { name: 'Dismiss notification' }),
    ).toHaveLength(2)
    const text = left.getByText('Left reloaded')
    expect(text).not.toHaveClass('line-clamp-2')
    expect(text.closest('[data-notification-card]')).toHaveStyle({
      userSelect: 'text',
    })
    fireEvent.click(
      left.getAllByRole('button', { name: 'Dismiss notification' })[1]!,
    )
    await waitFor(() =>
      expect(left.queryByText('Left reloaded')).not.toBeInTheDocument(),
    )
    expect(left.getByText('Left duplicated')).toBeVisible()
    expect(right.getByText('Right reloaded')).toBeInTheDocument()
    fireEvent.mouseLeave(left.getByRole('list'))
    expect(left.getByText('Left duplicated')).toHaveClass('line-clamp-2')
  })
})
