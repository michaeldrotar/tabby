import { describe, expect, it } from 'vitest'
import { isNavigableUrl } from './navigation.js'

describe('browser navigation', () => {
  it.each([
    'https://example.com/path?q=tabby',
    'chrome://settings',
    'file:///notes.html',
    'about:blank',
    'mailto:hello@example.com',
  ])('accepts a browser destination: %s', (url) => {
    expect(isNavigableUrl(url)).toBe(true)
  })
  it.each([
    'javascript:alert(1)',
    '  JaVaScRiPt:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'not a URL',
  ])('rejects an executable or invalid destination: %s', (url) => {
    expect(isNavigableUrl(url)).toBe(false)
  })
})
