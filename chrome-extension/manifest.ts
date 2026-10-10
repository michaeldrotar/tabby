import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getWindowSwitchCommandName,
  WINDOW_SWITCH_SLOT_COUNT,
} from '@extension/chrome/window/windowSwitchSlots'
import { TABBY_COMMANDS } from '@extension/shared/utils/commands'
import type { ManifestType } from '@extension/chrome/manifest'

// Read version from root package.json (the single source of truth)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf8'),
)

const manifest = {
  manifest_version: 3,
  minimum_chrome_version: '127',
  default_locale: 'en',
  name: '__MSG_extensionName__',
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  permissions: [
    'favicon',
    'storage',
    'tabs',
    'tabGroups',
    'sidePanel',
    'bookmarks',
    'history',
    'sessions',
  ],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_icon: 'tabby-face.png',
    default_title: 'Search with Tabby',
    default_popup: 'omnibar/index.html',
  },
  icons: {
    '128': 'tabby-face.png',
  },
  side_panel: {
    default_path: 'tab-manager/index.html',
  },
  commands: {
    [TABBY_COMMANDS.openOmnibar]: {
      suggested_key: {
        default: 'Alt+E',
        mac: 'Command+E',
      },
      description: 'Open Tabby Search',
    },
    [TABBY_COMMANDS.openTabManager]: {
      suggested_key: {
        default: 'Alt+Shift+E',
        mac: 'Command+Shift+E',
      },
      description: 'Open Tab Manager',
    },
    ...Object.fromEntries(
      Array.from({ length: WINDOW_SWITCH_SLOT_COUNT }, (_, index) => {
        const commandName = getWindowSwitchCommandName(index)
        return [
          commandName,
          {
            description: `Focus window ${index + 1}`,
          },
        ]
      }),
    ),
  },
} satisfies ManifestType

export default manifest
