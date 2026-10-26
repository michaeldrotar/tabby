import { expect, it } from 'vitest'
import { projectDownloadActions } from './downloadsModel'
import type { DownloadsSnapshot } from '@extension/core/downloads'

it('counts only eligible downloads in mixed selections and respects file-opening access', () => {
  const snapshot: DownloadsSnapshot = {
    status: 'ready',
    canOpen: false,
    items: [
      {
        id: 1,
        filename: 'report.pdf',
        status: 'Completed',
        warning: false,
        actions: ['open', 'show', 'erase'],
      },
      {
        id: 2,
        filename: 'assets.zip',
        status: 'Downloading',
        warning: false,
        actions: ['pause', 'cancel'],
      },
      {
        id: 3,
        filename: 'installer.exe',
        status: 'Needs review in Chrome',
        warning: true,
        actions: [],
      },
    ],
  }
  expect(projectDownloadActions(snapshot, new Set([1, 2]))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'open',
        label: 'Open 1 download',
        disabled: true,
      }),
      expect.objectContaining({ id: 'pause', label: 'Pause 1 download' }),
      expect.objectContaining({
        id: 'erase',
        label: 'Remove 1 download from history',
      }),
    ]),
  )
  expect(projectDownloadActions(snapshot, new Set([3]))).toEqual([
    expect.objectContaining({ id: 'review', label: 'Review in Chrome' }),
  ])
  expect(projectDownloadActions(snapshot, new Set([99]))).toEqual([])
})
