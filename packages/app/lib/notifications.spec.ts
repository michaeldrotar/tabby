import { deserializeDemoState, serializeDemoState } from '@extension/demo'
import { describe, expect, it } from 'vitest'
import { createNotificationController } from './notifications'
import { createTabManagerView } from './view'

const setup = () => {
  let now = 0
  const jobs: { run: () => void; delay: number; canceled: boolean }[] = []
  const view = createTabManagerView()
  const controller = createNotificationController(view, {
    now: () => now,
    schedule: (run, delay) => {
      const job = { run, delay, canceled: false }
      jobs.push(job)
      return () => {
        job.canceled = true
      }
    },
  })
  return {
    view,
    controller,
    jobs,
    time: (value: number) => {
      now = value
    },
  }
}

describe('controlled notifications', () => {
  it('retains independent messages, pauses their remaining lifetimes, and resumes after reading', () => {
    const { view, controller, jobs, time } = setup()
    controller.publish({ message: 'Tabs reloaded' })
    time(1000)
    controller.publish({ message: 'Tabs duplicated' })
    const obsolete = jobs.at(-1)!
    time(1500)
    controller.expand(true)
    expect(
      view
        .getState()
        .notifications.items.map((entry) => [entry.message, entry.remainingMs]),
    ).toEqual([
      ['Tabs duplicated', 3500],
      ['Tabs reloaded', 2500],
    ])
    time(10000)
    obsolete.run()
    expect(view.getState().notifications.items).toHaveLength(2)
    controller.expand(false)
    expect(jobs.slice(-2).map((job) => job.delay)).toEqual([3500, 2500])
    time(12500)
    jobs.at(-1)!.run()
    expect(
      view.getState().notifications.items.map((entry) => entry.message),
    ).toEqual(['Tabs duplicated'])
    controller.dismiss(view.getState().notifications.items[0]!.id)
    expect(view.getState().notifications).toMatchObject({
      items: [],
      paused: false,
      expanded: false,
    })
    controller.dispose()
  })

  it('restores serializable IDs and timing, cancels stale work, and isolates another instance', () => {
    const first = setup(),
      second = setup()
    first.controller.publish(
      { message: 'Persistent error', kind: 'error' },
      null,
    )
    first.controller.publish({ message: 'Timed confirmation' }, 2000)
    first.time(500)
    first.controller.expand(true)
    const checkpoint = deserializeDemoState<
      ReturnType<typeof first.view.getState>
    >(serializeDemoState(first.view.getState()))
    const obsolete = first.jobs.at(-1)!
    first.controller.dismiss(1)
    first.controller.publish({ message: 'Newer result' })
    first.view.setState(checkpoint, true)
    obsolete.run()
    expect(first.view.getState()).toEqual(checkpoint)
    first.controller.publish({ message: 'Restored allocation' })
    expect(first.view.getState().notifications.items[0]?.id).toBe(3)
    first.controller.dispose()
    first.jobs.at(-1)?.run()
    expect(first.view.getState().notifications.items).toHaveLength(3)
    expect(second.view.getState().notifications.items).toEqual([])
    second.controller.dispose()
  })
})
