import { describe, expect, it, vi } from 'vitest'
import {
  createChromeDownloadsResource,
  projectDownload,
} from './createChromeDownloadsResource.js'

const item = (overrides: Partial<chrome.downloads.DownloadItem> = {}) =>
  ({
    id: 1,
    filename: '/Downloads/Report.pdf',
    url: 'https://example.com/report',
    finalUrl: '',
    state: 'complete',
    danger: 'safe',
    exists: true,
    paused: false,
    canResume: false,
    ...overrides,
  }) as chrome.downloads.DownloadItem
const event = () => {
  const listeners = new Set<() => void>()
  return {
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    emit: () => listeners.forEach((listener) => listener()),
    listeners,
  }
}
const setup = () => {
  let granted = false
  const api = {
    permissions: {
      contains: vi.fn(async () => granted),
      request: vi.fn(async () => {
        granted = true
        return true
      }),
      onAdded: event(),
      onRemoved: event(),
    },
    downloads: {
      search: vi.fn(async () => [item()]),
      open: vi.fn(async () => {}),
      show: vi.fn(),
      erase: vi.fn(async () => [1]),
      pause: vi.fn(async () => {}),
      resume: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      onCreated: event(),
      onChanged: event(),
      onErased: event(),
    },
    tabs: { create: vi.fn(async () => ({})) },
  }
  return {
    api,
    resource: createChromeDownloadsResource(
      api as unknown as Parameters<typeof createChromeDownloadsResource>[0],
    ),
    revoke: () => {
      granted = false
      api.permissions.onRemoved.emit()
    },
  }
}

describe('recent downloads', () => {
  it('projects native states into safe available actions without requiring source URLs', () => {
    expect(projectDownload(item())).toMatchObject({
      filename: 'Report.pdf',
      source: 'example.com',
      status: 'Completed',
      actions: ['open', 'show', 'erase'],
    })
    expect(projectDownload(item({ state: 'in_progress' }))).toMatchObject({
      status: 'Downloading',
      actions: ['pause', 'cancel'],
    })
    expect(
      projectDownload(
        item({ state: 'in_progress', paused: true, canResume: true }),
      ),
    ).toMatchObject({ status: 'Paused', actions: ['resume', 'cancel'] })
    expect(
      projectDownload(item({ state: 'interrupted', canResume: true })),
    ).toMatchObject({ status: 'Interrupted', actions: ['resume', 'erase'] })
    expect(
      projectDownload(
        item({ exists: false, url: 'file:///private/report.pdf' }),
      ),
    ).toMatchObject({
      source: undefined,
      status: 'File unavailable',
      actions: ['erase'],
    })
    expect(projectDownload(item({ danger: 'uncommon' }))).toMatchObject({
      warning: true,
      status: 'Needs review in Chrome',
      actions: [],
    })
  })

  it('requests access from the click, refreshes events, performs native actions, and removes history only', async () => {
    const { api, resource, revoke } = setup()
    await resource.start()
    expect(resource.getSnapshot().status).toBe('permission')
    expect(api.downloads.search).not.toHaveBeenCalled()
    const request = resource.requestAccess()
    expect(api.permissions.request).toHaveBeenCalledWith({
      permissions: ['downloads', 'downloads.open'],
    })
    await request
    expect(resource.getSnapshot().items).toHaveLength(1)
    const opening = resource.execute(1, 'open')
    expect(api.downloads.open).toHaveBeenCalledWith(1)
    await opening
    await resource.execute(1, 'show')
    expect(api.downloads.show).toHaveBeenCalledWith(1)
    await resource.execute(1, 'erase')
    expect(api.downloads.erase).toHaveBeenCalledWith({ id: 1 })
    api.downloads.search.mockResolvedValue([])
    api.downloads.onErased.emit()
    await vi.waitFor(() => expect(resource.getSnapshot().items).toEqual([]))
    revoke()
    await vi.waitFor(() =>
      expect(resource.getSnapshot().status).toBe('permission'),
    )
    expect(api.downloads.onChanged.listeners.size).toBe(0)
    resource.dispose()
    expect(api.permissions.onRemoved.listeners.size).toBe(0)
  })

  it('handles denial, native failures, and a search finishing after revocation or disposal', async () => {
    const { api, resource, revoke } = setup()
    await resource.start()
    api.permissions.request.mockResolvedValueOnce(false)
    await resource.requestAccess()
    expect(resource.getSnapshot()).toMatchObject({
      status: 'permission',
      error: expect.stringContaining('not granted'),
    })
    await resource.requestAccess()
    api.downloads.open.mockRejectedValueOnce(new Error('File missing'))
    await resource.execute(1, 'open')
    expect(resource.getSnapshot().error).toContain('no longer be available')
    let finish!: (items: chrome.downloads.DownloadItem[]) => void
    api.downloads.search.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    api.downloads.onChanged.emit()
    await vi.waitFor(() => expect(finish).toBeDefined())
    revoke()
    await vi.waitFor(() =>
      expect(resource.getSnapshot().status).toBe('permission'),
    )
    finish([item()])
    await Promise.resolve()
    expect(resource.getSnapshot().items).toEqual([])
    resource.dispose()
    expect(resource.getSnapshot().items).toEqual([])
  })
  it('applies a batch only to eligible items and keeps partial failures visible', async () => {
    const { api, resource } = setup()
    api.downloads.search.mockResolvedValue([
      item({ id: 1, state: 'in_progress' }),
      item({ id: 2, state: 'in_progress' }),
      item({ id: 3 }),
    ])
    await resource.start()
    await resource.requestAccess()
    api.downloads.pause.mockRejectedValueOnce(new Error('Already finished'))
    await resource.execute([1, 2, 3], 'pause')
    expect(api.downloads.pause.mock.calls).toEqual([[1], [2]])
    expect(resource.getSnapshot().error).toContain(
      'A download could not be updated',
    )
    resource.dispose()
  })
})
