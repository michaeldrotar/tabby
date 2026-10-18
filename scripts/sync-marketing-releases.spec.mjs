import { expect, test } from 'vitest'
import { publishedReleaseNotes } from './sync-marketing-releases.mjs'

test('release snapshots keep published notes verbatim and order versions numerically', () => {
  const body = '## Changes\r\n\r\n- **Find tabs** with `Alt+E`.\r\n'
  const release = {
    tag_name: 'v1.10.0',
    name: 'Find tabs faster',
    published_at: '2026-10-18T12:00:00Z',
    body,
    draft: false,
    prerelease: false,
  }
  expect(
    publishedReleaseNotes([
      { ...release, tag_name: 'v1.9.0', name: null, body: null },
      { ...release, tag_name: 'v1.11.0', draft: true },
      { ...release, tag_name: 'v1.12.0-beta.1', prerelease: true },
      release,
    ]),
  ).toEqual([
    {
      version: 'v1.10.0',
      title: 'Find tabs faster',
      publishedAt: release.published_at,
      body,
    },
    {
      version: 'v1.9.0',
      title: 'v1.9.0',
      publishedAt: release.published_at,
      body: '',
    },
  ])
})
