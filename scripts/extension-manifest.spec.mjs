import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import manifest from '../chrome-extension/manifest.ts'

describe('extension icons', () => {
  it('ships a real PNG at every declared icon size', () => {
    for (const icons of [manifest.icons, manifest.action.default_icon]) {
      for (const [size, filename] of Object.entries(icons)) {
        const image = readFileSync(
          new URL(`../chrome-extension/public/${filename}`, import.meta.url),
        )
        expect(image.subarray(1, 4).toString()).toBe('PNG')
        expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([
          Number(size),
          Number(size),
        ])
      }
    }
  })
})
