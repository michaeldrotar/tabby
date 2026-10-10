// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RadialLoadingSpinner } from './RadialLoadingSpinner'
import { Surface } from './Surface'

afterEach(cleanup)
it('settles a running spinner into fixed geometry when capturing or pausing a scene', () => {
  const { rerender } = render(
    <Surface inputMode="scripted" motion="full">
      <RadialLoadingSpinner />
    </Surface>,
  )
  const running = screen.getByRole('progressbar').querySelector('circle')!
  expect(running.style.transform).toContain('rotate')
  rerender(
    <Surface inputMode="static" motion="full">
      <RadialLoadingSpinner />
    </Surface>,
  )
  const frame = screen
    .getByRole('progressbar', { hidden: true })
    .querySelector('circle')!
  expect(frame.getAttribute('transform')).toBe('rotate(-110 10 10)')
  expect(frame.style.transform).toBe('')
  rerender(
    <Surface inputMode="scripted" motion="reduced">
      <RadialLoadingSpinner />
    </Surface>,
  )
  const paused = screen
    .getByRole('progressbar', { hidden: true })
    .querySelector('circle')!
  expect(paused.getAttribute('transform')).toBe(frame.getAttribute('transform'))
  expect(paused.getAttribute('stroke-dasharray')).toBe(
    frame.getAttribute('stroke-dasharray'),
  )
  expect(paused.getAttribute('stroke-width')).toBe(
    frame.getAttribute('stroke-width'),
  )
})
