// @vitest-environment jsdom
import * as matchers from '@testing-library/jest-dom/matchers'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastStatus } from './ToastStatus'

expect.extend(matchers)

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

const notify = async (publish: () => void) => {
  act(publish)
  await advance(20)
}

const dismissFront = async () => {
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Dismiss notification' })[0]!,
  )
  await advance(450)
  await advance(20)
}

describe('ToastStatus', () => {
  const onDismiss = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    onDismiss.mockClear()
    render(
      <ToastStatus dismissLabel="Dismiss notification" onDismiss={onDismiss}>
        <button type="button">More actions</button>
      </ToastStatus>,
    )
  })

  afterEach(() => {
    cleanup()
    toast.dismiss()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('covers the actions until the confirmation is dismissed', async () => {
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More actions' })).toBeVisible()
    const onToastDismiss = vi.fn()

    await notify(() => {
      toast.success('Tab discarded from memory', { onDismiss: onToastDismiss })
    })
    expect(screen.getByRole('listitem')).toHaveTextContent(
      'Tab discarded from memory',
    )
    expect(
      screen.queryByRole('button', { name: 'More actions' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Tab discarded from memory'))
    await advance(450)
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    expect(onToastDismiss).not.toHaveBeenCalled()
    await dismissFront()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More actions' })).toBeVisible()
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(onToastDismiss).toHaveBeenCalledOnce()
  })

  it('keeps messages while hovered and resumes expiry when the pointer leaves', async () => {
    await notify(() => {
      toast.success('2 tabs reloaded', { duration: 2000 })
    })
    await advance(1000)

    await notify(() => {
      toast.warning('1 of 2 tabs discarded; the active tab was skipped')
    })
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    const message = screen.getByText(
      '1 of 2 tabs discarded; the active tab was skipped',
    )
    fireEvent.mouseOver(message)
    fireEvent.mouseMove(message)

    await advance(5000)
    expect(screen.getByText('2 tabs reloaded')).toBeInTheDocument()
    expect(message).toBeInTheDocument()
    fireEvent.mouseOut(message)
    await advance(1500)
    expect(screen.queryByText('2 tabs reloaded')).not.toBeInTheDocument()
    expect(message).toBeInTheDocument()
    await advance(3100)
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses only the front message with each X and restores the actions after the last', async () => {
    await notify(() => toast.success('2 tabs reloaded'))
    await notify(() => toast.success('2 tabs duplicated'))
    await dismissFront()
    expect(screen.queryByText('2 tabs duplicated')).not.toBeInTheDocument()
    expect(screen.getByText('2 tabs reloaded')).toBeInTheDocument()
    expect(onDismiss).not.toHaveBeenCalled()
    await dismissFront()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More actions' })).toBeVisible()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('requests focus restoration when a focused confirmation expires', async () => {
    await notify(() => {
      toast.success('2 tabs reloaded')
    })
    screen.getByRole('button', { name: 'Dismiss notification' }).focus()

    await advance(4500)
    await advance(20)
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('honors notifications that stay open until explicitly dismissed', async () => {
    await notify(() => {
      toast.error('Chrome could not discard this tab', { duration: Infinity })
    })
    await advance(10000)
    await dismissFront()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
