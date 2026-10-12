import { describe, expect, it } from 'vitest'
import { createAsyncQueue } from './asyncQueue.js'

describe('async operation queue', () => {
  it('preserves submission order and continues after an operation fails', async () => {
    const queue = createAsyncQueue()
    const applied: string[] = []
    let release!: () => void
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const first = queue.run(async () => {
      await blocked
      applied.push('first')
      return 1
    })
    const failed = queue.run(async () => {
      applied.push('failed')
      throw new Error('Write failed')
    })
    const failure = expect(failed).rejects.toThrow('Write failed')
    const last = queue.run(async () => {
      applied.push('last')
      return 3
    })
    expect(applied).toEqual([])
    release()
    expect(await first).toBe(1)
    await failure
    expect(await last).toBe(3)
    await queue.wait()
    expect(applied).toEqual(['first', 'failed', 'last'])
  })
})
