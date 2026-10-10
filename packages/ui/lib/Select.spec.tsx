// @vitest-environment jsdom
import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select'
import { Surface } from './Surface'

afterEach(cleanup)
const Example = () => {
  const [value, setValue] = useState('amber')
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger aria-label="Accent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="amber">Amber</SelectItem>
        <SelectItem value="blue">Blue</SelectItem>
        <SelectItem value="rose">Rose</SelectItem>
      </SelectContent>
    </Select>
  )
}
describe('scoped select', () => {
  it('keeps shared open controls on the initiating surface keyboard target', () => {
    const Shared = () => {
      const [open, setOpen] = useState(false)
      const [value, setValue] = useState('amber')
      return (
        <>
          {['Left', 'Right'].map((name) => (
            <section key={name} aria-label={name}>
              <Surface>
                <Select
                  open={open}
                  onOpenChange={setOpen}
                  value={value}
                  onValueChange={setValue}
                >
                  <SelectTrigger aria-label="Accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                  </SelectContent>
                </Select>
              </Surface>
            </section>
          ))}
        </>
      )
    }
    render(<Shared />)
    const left = within(screen.getByRole('region', { name: 'Left' }))
    const right = within(screen.getByRole('region', { name: 'Right' }))
    const trigger = left.getByRole('combobox')
    act(() => trigger.focus())
    fireEvent.click(trigger)
    expect(document.activeElement).toBe(left.getByRole('listbox'))
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(
      left
        .getByRole('option', { name: 'Blue' })
        .hasAttribute('data-highlighted'),
    ).toBe(true)
    expect(
      right
        .getByRole('option', { name: 'Amber' })
        .hasAttribute('data-highlighted'),
    ).toBe(true)
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(left.getByRole('combobox').textContent).toBe('Blue')
    expect(right.getByRole('combobox').textContent).toBe('Blue')
    expect(document.activeElement).toBe(trigger)
  })
  it('buffers typed prefixes, cycles repeated letters, and keeps the highlighted choice visible', () => {
    const change = vi.fn()
    render(
      <Surface>
        <Select defaultValue="amber" onValueChange={change}>
          <SelectTrigger aria-label="Palette">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amber">Amber</SelectItem>
            <SelectItem value="black">Black</SelectItem>
            <SelectItem value="blocked" disabled>
              Blanched almond
            </SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="rose">Rose</SelectItem>
          </SelectContent>
        </Select>
      </Surface>,
    )
    fireEvent.click(screen.getByRole('combobox'))
    const popup = screen.getByRole('listbox')
    const type = (key: string, timeStamp: number) => {
      const event = createEvent.keyDown(popup, { key })
      Object.defineProperty(event, 'timeStamp', { value: timeStamp })
      fireEvent(popup, event)
    }
    type('b', 100)
    expect(
      screen
        .getByRole('option', { name: 'Black' })
        .hasAttribute('data-highlighted'),
    ).toBe(true)
    type('l', 200)
    type('u', 300)
    expect(
      screen
        .getByRole('option', { name: 'Blue' })
        .hasAttribute('data-highlighted'),
    ).toBe(true)
    type('b', 1500)
    expect(
      screen
        .getByRole('option', { name: 'Black' })
        .hasAttribute('data-highlighted'),
    ).toBe(true)
    type('b', 1600)
    expect(
      screen
        .getByRole('option', { name: 'Blue' })
        .hasAttribute('data-highlighted'),
    ).toBe(true)
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 40,
    } as DOMRect)
    vi.spyOn(
      screen.getByRole('option', { name: 'Rose' }),
      'getBoundingClientRect',
    ).mockReturnValue({ top: 60, bottom: 80 } as DOMRect)
    fireEvent.keyDown(popup, { key: 'End' })
    expect(popup.scrollTop).toBe(40)
    fireEvent.keyDown(popup, { key: 'Enter' })
    expect(change).toHaveBeenCalledExactlyOnceWith('rose')
  })
  it('changes a closed value with arrows and an open value with keyboard selection', () => {
    render(
      <Surface>
        <Example />
      </Surface>,
    )
    const trigger = screen.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger.textContent).toBe('Blue')
    fireEvent.keyDown(trigger, { key: 'Enter' })
    const popup = screen.getByRole('listbox')
    fireEvent.keyDown(popup, { key: 'End' })
    fireEvent.keyDown(popup, { key: 'Enter' })
    expect(trigger.textContent).toBe('Rose')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
  it('keeps two open menus and themes local without changing body input or scroll', () => {
    const outside = vi.fn()
    render(
      <>
        <button onClick={outside}>Outside control</button>
        <section aria-label="Left">
          <Surface instanceId="left" theme="light">
            <Example />
          </Surface>
        </section>
        <section aria-label="Right">
          <Surface instanceId="right" theme="dark">
            <Example />
          </Surface>
        </section>
      </>,
    )
    const left = within(screen.getByRole('region', { name: 'Left' }))
    const right = within(screen.getByRole('region', { name: 'Right' }))
    fireEvent.click(left.getByRole('combobox'))
    fireEvent.click(right.getByRole('combobox'))
    expect(
      left
        .getByRole('listbox')
        .closest('[data-surface]')
        ?.getAttribute('data-theme'),
    ).toBe('light')
    expect(
      right
        .getByRole('listbox')
        .closest('[data-surface]')
        ?.getAttribute('data-theme'),
    ).toBe('dark')
    expect(left.getByRole('listbox').id).not.toBe(right.getByRole('listbox').id)
    expect(document.body.style.pointerEvents).toBe('')
    expect(document.body.style.overflow).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Outside control' }))
    expect(outside).toHaveBeenCalledOnce()
  })
  it('stages an open menu without moving focus or accepting product input', () => {
    const change = vi.fn()
    render(
      <>
        <button>Playback</button>
        <Surface inputMode="scripted">
          <Select open value="amber" onValueChange={change}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amber">Amber</SelectItem>
              <SelectItem value="rose">Rose</SelectItem>
            </SelectContent>
          </Select>
        </Surface>
      </>,
    )
    const playback = screen.getByRole('button', { name: 'Playback' })
    act(() => playback.focus())
    fireEvent.click(screen.getByRole('option', { name: 'Rose', hidden: true }))
    expect(change).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(playback)
  })
})
