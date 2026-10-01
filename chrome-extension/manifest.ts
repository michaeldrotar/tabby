import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ManifestType } from '@extension/shared/utils/types'

// Read version from root package.json (the single source of truth)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf8'),
)

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 */
const manifest = {
  manifest_version: 3,
  minimum_chrome_version: '127',
  default_locale: 'en',
  name: '__MSG_extensionName__',
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
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
    default_popup: 'omnibar-popup/index.html',
  },
  icons: {
    '128': 'tabby-face.png',
  },
  side_panel: {
    default_path: 'tab-manager/index.html',
  },
  commands: {
    'open-omnibar': {
      suggested_key: {
        default: 'Alt+E',
        mac: 'Command+E',
      },
      description: 'Open Tabby Search',
    },
    'open-tab-manager': {
      suggested_key: {
        default: 'Alt+Shift+E',
        mac: 'Command+Shift+E',
      },
      description: 'Open Tab Manager',
    },
  },
} satisfies ManifestType

export default manifest
