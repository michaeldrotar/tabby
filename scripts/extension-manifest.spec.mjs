import { readFileSync } from 'node:fs'
import {
  getIncognitoIconPath,
  INCOGNITO_ICON_OPTIONS,
} from '../packages/core/lib/incognitoIcons.ts'
import { describe, expect, it } from 'vitest'
import manifest from '../chrome-extension/manifest.ts'

describe('extension icons', () => {
  it('ships a real PNG at every declared icon size', () => {
    const incognitoIcons = INCOGNITO_ICON_OPTIONS.filter(
      (option) => option.id !== 'classic',
    ).map((option) =>
      Object.fromEntries(
        [16, 32, 48, 128].map((size) => [
          size,
          getIncognitoIconPath(option.id, size),
        ]),
      ),
    )
    for (const icons of [
      manifest.icons,
      manifest.action.default_icon,
      ...incognitoIcons,
    ]) {
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
