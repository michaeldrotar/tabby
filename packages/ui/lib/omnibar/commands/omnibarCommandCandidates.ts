import { OmnibarCommandRunIcon } from './OmnibarCommandRunIcon'
import { generateOmnibarActionTextFn } from '../actions/generateOmnibarActionTextFn'
import { generateOmnibarUrlFn } from '../actions/generateOmnibarUrlFn'
import { exampleThemeStorage } from '@extension/storage'
import type { OmnibarActionTextFn } from '../actions/OmnibarActionTextFn'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

const getRunActionText: OmnibarActionTextFn = () => {
  return { primaryText: 'Run' }
}

const getOpenActionText: OmnibarActionTextFn =
  generateOmnibarActionTextFn('Open')

type CommandCandidateOptions = Pick<
  OmnibarSearchCandidate,
  | 'title'
  | 'IconComponent'
  | 'url'
  | 'searchFields'
  | 'getActionText'
  | 'performAction'
>

const createCommandCandidate = (
  options: CommandCandidateOptions,
): OmnibarSearchCandidate => {
  return {
    id: `command:${options.title.toLowerCase().replace(/\s+/, '')}`,
    type: 'command',
    ...options,
  }
}

type TabbyCommandCandidateOptions = Pick<
  CommandCandidateOptions,
  'title' | 'performAction'
>

const createTabbyCommandCandidate = (
  options: TabbyCommandCandidateOptions,
): OmnibarSearchCandidate => {
  return createCommandCandidate({
    IconComponent: OmnibarCommandRunIcon,
    searchFields: ['title'],
    getActionText: getRunActionText,
    ...options,
  })
}

type UrlCommandCandidateOptions = Pick<CommandCandidateOptions, 'title'> & {
  url: string
}

const createUrlCommandCandidate = (
  options: UrlCommandCandidateOptions,
): OmnibarSearchCandidate => {
  return createCommandCandidate({
    IconComponent: OmnibarCommandRunIcon,
    searchFields: ['title', 'url'],
    getActionText: getOpenActionText,
    performAction: generateOmnibarUrlFn(options.url),
    ...options,
  })
}

export const omnibarCommandCandidates: OmnibarSearchCandidate[] = [
  createTabbyCommandCandidate({
    title: 'Tabby: Open Tab Manager',
    performAction: async (_modifier, originalWindowId) => {
      if (originalWindowId) {
        await chrome.sidePanel.open({ windowId: originalWindowId })
      } else {
        throw new Error(
          'Unable to open the side panel because originalWindowId is not defined',
        )
      }
    },
  }),
  createTabbyCommandCandidate({
    title: 'Tabby: Toggle Theme',
    performAction: async () => {
      await exampleThemeStorage.toggle()
    },
  }),
  createUrlCommandCandidate({
    title: 'Chrome: Open Settings',
    url: 'chrome://settings',
  }),
  createUrlCommandCandidate({
    title: 'Chrome: Manage Extensions',
    url: 'chrome://extensions',
  }),
  createUrlCommandCandidate({
    title: 'Chrome: History',
    url: 'chrome://history',
  }),
  createUrlCommandCandidate({
    title: 'Chrome: Downloads',
    url: 'chrome://downloads',
  }),
  createUrlCommandCandidate({
    title: 'Chrome: Bookmarks Manager',
    url: 'chrome://bookmarks',
  }),
  createUrlCommandCandidate({
    title: 'Chrome: Password Manager',
    url: 'chrome://password-manager',
  }),
  createUrlCommandCandidate({
    title: 'Chrome: Clear Browsing Data',
    url: 'chrome://settings/clearBrowserData',
  }),
]
