import { describe, expect, it } from 'vitest'
import {
  defaultWindowIcon,
  getWindowIconChoices,
  getWindowIconKind,
  getWindowIconValue,
  isWindowIcon,
  SUGGESTED_WINDOW_ICONS,
} from './windowIconChoice.js'

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='
describe('window icon choices', () => {
  it('accepts library icons, one emoji, monograms, and local image thumbnails', () => {
    for (const icon of [
      'rocket',
      'emoji:👩🏽‍💻',
      'emoji:🇨🇦',
      'monogram:AB3',
      'monogram:',
      `upload:${png}`,
      `favicon:${png}`,
    ])
      expect(isWindowIcon(icon)).toBe(true)
    expect(getWindowIconKind(`favicon:${png}`)).toBe('favicon')
    expect(getWindowIconValue('monogram:AB3')).toBe('AB3')
    expect(getWindowIconKind()).toBe('favicon')
    expect(isWindowIcon('favicon:auto')).toBe(true)
    expect(isWindowIcon('upload:empty')).toBe(true)
    expect(SUGGESTED_WINDOW_ICONS.every(isWindowIcon)).toBe(true)
  })
  it('retains valid choices for each type and replaces only the active choice', () => {
    expect(
      getWindowIconChoices('emoji:😎', {
        icon: 'code',
        emoji: 'emoji:😀',
        upload: `upload:${png}`,
        favicon: 'favicon:auto',
        monogram: 'invalid',
        invalid: 'book',
      }),
    ).toEqual({
      icon: 'code',
      emoji: 'emoji:😎',
      upload: `upload:${png}`,
      favicon: 'favicon:auto',
    })
    expect(getWindowIconChoices('book')).toEqual({ icon: 'book' })
    expect(defaultWindowIcon('monogram', 'Project notes')).toBe('monogram:PN')
    expect(defaultWindowIcon('icon', 'Project notes')).toBe('window')
  })
  it('rejects invalid content, remote images, and oversized thumbnails', () => {
    for (const icon of [
      undefined,
      'unknown',
      'emoji:hello',
      'emoji:🐱🐶',
      'monogram:ABCD',
      'monogram:<b>',
      'upload:https://example.com/logo.png',
      'favicon:chrome-extension://id/_favicon/?pageUrl=https://example.com',
      `upload:data:image/png;base64,${'A'.repeat(33000)}`,
    ])
      expect(isWindowIcon(icon)).toBe(false)
  })
})
