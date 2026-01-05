/**
 * Comprehensive Chrome API mock for testing.
 * Provides mock implementations of commonly used Chrome Extension APIs.
 */
import { vi } from 'vitest'

export type MockTab = {
  id: number
  windowId: number
  index: number
  title: string
  url: string
  active: boolean
  pinned: boolean
  audible: boolean
  mutedInfo: { muted: boolean }
  groupId: number
  favIconUrl?: string
  discarded?: boolean
}

export type MockWindow = {
  id: number
  focused: boolean
  incognito: boolean
  type: 'normal' | 'popup' | 'devtools'
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen'
}

export type MockTabGroup = {
  id: number
  windowId: number
  title: string
  color:
    | 'grey'
    | 'blue'
    | 'red'
    | 'yellow'
    | 'green'
    | 'pink'
    | 'purple'
    | 'cyan'
    | 'orange'
  collapsed: boolean
}

/**
 * Creates a mock tab with sensible defaults.
 */
export const createMockTab = (overrides: Partial<MockTab> = {}): MockTab => ({
  id: Math.floor(Math.random() * 10000),
  windowId: 1,
  index: 0,
  title: 'Test Tab',
  url: 'https://example.com',
  active: false,
  pinned: false,
  audible: false,
  mutedInfo: { muted: false },
  groupId: -1,
  ...overrides,
})

/**
 * Creates a mock window with sensible defaults.
 */
export const createMockWindow = (
  overrides: Partial<MockWindow> = {},
): MockWindow => ({
  id: Math.floor(Math.random() * 10000),
  focused: true,
  incognito: false,
  type: 'normal',
  state: 'normal',
  ...overrides,
})

/**
 * Creates a mock tab group with sensible defaults.
 */
export const createMockTabGroup = (
  overrides: Partial<MockTabGroup> = {},
): MockTabGroup => ({
  id: Math.floor(Math.random() * 10000),
  windowId: 1,
  title: 'Test Group',
  color: 'blue',
  collapsed: false,
  ...overrides,
})

/**
 * Creates a complete Chrome API mock.
 * All methods are vi.fn() mocks that can be configured per test.
 */
export const createChromeMock = () => ({
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(createMockTab()),
    create: vi.fn().mockResolvedValue(createMockTab()),
    update: vi.fn().mockResolvedValue(createMockTab()),
    remove: vi.fn().mockResolvedValue(undefined),
    duplicate: vi.fn().mockResolvedValue(createMockTab()),
    move: vi.fn().mockResolvedValue(createMockTab()),
    reload: vi.fn().mockResolvedValue(undefined),
    group: vi.fn().mockResolvedValue(1),
    ungroup: vi.fn().mockResolvedValue(undefined),
    onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
    onMoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  windows: {
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(createMockWindow()),
    getCurrent: vi.fn().mockResolvedValue(createMockWindow()),
    create: vi.fn().mockResolvedValue(createMockWindow()),
    update: vi.fn().mockResolvedValue(createMockWindow()),
    remove: vi.fn().mockResolvedValue(undefined),
    onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onFocusChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  tabGroups: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(createMockTabGroup()),
    update: vi.fn().mockResolvedValue(createMockTabGroup()),
    move: vi.fn().mockResolvedValue(createMockTabGroup()),
    onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
    onMoved: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    getManifest: vi.fn().mockReturnValue({ version: '1.0.0' }),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  },
  i18n: {
    getMessage: vi.fn((key: string) => key),
    getUILanguage: vi.fn().mockReturnValue('en'),
  },
})

/**
 * Installs the Chrome mock globally.
 * Call this in beforeEach or at the top of test files that need Chrome APIs.
 */
export const installChromeMock = () => {
  const mock = createChromeMock()
  ;(globalThis as unknown as { chrome: typeof mock }).chrome = mock
  return mock
}

/**
 * Resets all Chrome mock functions.
 * Call this in afterEach to ensure clean state between tests.
 */
export const resetChromeMock = () => {
  const chrome = (
    globalThis as unknown as { chrome: ReturnType<typeof createChromeMock> }
  ).chrome
  if (!chrome) return

  // Reset all mock functions recursively
  const resetMocks = (obj: Record<string, unknown>) => {
    for (const value of Object.values(obj)) {
      if (typeof value === 'function' && 'mockReset' in value) {
        ;(value as ReturnType<typeof vi.fn>).mockReset()
      } else if (typeof value === 'object' && value !== null) {
        resetMocks(value as Record<string, unknown>)
      }
    }
  }
  resetMocks(chrome)
}
