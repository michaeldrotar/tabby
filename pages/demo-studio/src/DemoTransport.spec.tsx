// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { createDemoPlayer } from '@extension/demo/player'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DemoTransport } from './DemoTransport'

afterEach(cleanup)

describe('DemoTransport', () => {
  it('navigates named workflow steps across internal action frames and preserves playback status', () => {
    const restore = vi.fn()
    const player = createDemoPlayer(
      [
        {
          at: 0,
          title: 'Prepare pinning',
          state: { pinned: false, muted: false },
        },
        { at: 500, title: 'Pin tab', state: { pinned: true, muted: false } },
        { at: 1000, title: 'Mute audio', state: { pinned: true, muted: true } },
        { at: 2000, title: 'Complete', state: { pinned: true, muted: true } },
      ],
      restore,
      { now: () => 0, schedule: () => () => {} },
      (state) => ({ ...state }),
    )
    render(
      <DemoTransport
        player={player}
        steps={[
          { at: 0, title: 'Pin tab' },
          { at: 1000, title: 'Mute audio' },
        ]}
        name="Workflow"
      />,
    )
    expect(screen.getByText('Paused')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(restore).toHaveBeenLastCalledWith(
      { pinned: true, muted: true },
      1000,
    )
    expect(screen.getByText('Paused')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByText('Playing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(restore).toHaveBeenLastCalledWith({ pinned: false, muted: false }, 0)
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.change(
      screen.getByRole('slider', { name: 'Tutorial position' }),
      { target: { value: '500' } },
    )
    expect(restore).toHaveBeenLastCalledWith(
      { pinned: true, muted: false },
      500,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rewind' }))
    expect(restore).toHaveBeenLastCalledWith({ pinned: false, muted: false }, 0)
    expect(screen.getByText('Paused')).toBeInTheDocument()
    player.dispose()
  })
})
