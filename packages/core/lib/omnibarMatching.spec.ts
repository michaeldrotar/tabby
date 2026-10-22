import { describe, expect, it } from 'vitest'
import { createOmnibarMatcher } from './omnibarMatching'

describe('Omnibar matching', () => {
  it.each([
    ['e', 'Options', 'chrome-extension://tabby/options/index.html', true],
    ['e', 'Google Calendar', 'https://calendar.google.com', true],
    ['oob', 'Foobar', '', true],
    ['  FOO  alpha ', 'Foobar', 'https://example.com/alpha', true],
    ['foo missing', 'Foobar', 'https://example.com/alpha', false],
    ['"foo bar"', 'Foo bar', '', false],
    ['cafe', 'Café', '', false],
    ['???', 'Unknown', 'https://example.com', false],
    ['', 'Anything', '', true],
  ])(
    'matches %s in title %s and URL %s as %s',
    (query, title, url, matches) => {
      expect(createOmnibarMatcher(query)(title, url)).toBe(matches)
    },
  )

  it('matches aliases alongside the title and URL', () => {
    expect(
      createOmnibarMatcher('atlas window 2')('Atlas', '', ['window 2']),
    ).toBe(true)
  })
})
