import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ManifestType } from '@extension/shared'

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
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
  manifest_version: 3,
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
    'activeTab',
    'favicon',
    'storage',
    'scripting',
    'tabs',
    'tabGroups',
    'sidePanel',
    'bookmarks',
    'history',
    'sessions',
    'notifications',
  ],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_icon: 'tabby-face.png',
    default_title: 'Tabby',
  },
  icons: {
    '128': 'tabby-face.png',
  },
  web_accessible_resources: [
    {
      resources: [
        'omnibar-overlay/index.html',
        'omnibar-embed/*',
        '_favicon/*',
      ],
      matches: ['*://*/*'],
    },
  ],
  side_panel: {
    default_path: 'tab-manager/index.html',
  },
  commands: {
    'open-omnibar-overlay': {
      suggested_key: {
        default: 'Alt+E',
        mac: 'Command+E',
      },
      description: 'Open Omnibar Overlay',
    },
    'open-omnibar-popup': {
      suggested_key: {
        default: 'Alt+K',
        mac: 'Command+K',
      },
      description: 'Open Omnibar Popup',
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
