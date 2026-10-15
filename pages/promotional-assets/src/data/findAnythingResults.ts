import mailFavicon from '../assets/mail-favicon.svg'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/Omnibar'

const execute = async () => undefined

export const findAnythingResults: OmnibarSearchResult[] = [
  {
    id: 'search-google',
    type: 'search',
    title: 'Search Google',
    url: 'https://www.google.com/search?q=inbox',
    execute,
  },
  {
    id: 'inbox-window',
    type: 'window',
    title: 'Customer inbox',
    description: 'Window 2 · 8 tabs',
    windowIcon: 'briefcase',
    windowIconColor: 'green',
    execute,
  },
  {
    id: 'support-inbox-tab',
    type: 'tab',
    title: 'Customer inbox',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    favIconUrl: mailFavicon,
    execute,
  },
  {
    id: 'gmail-inbox-bookmark',
    type: 'bookmark',
    title: 'Inbox | Gmail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    favIconUrl: mailFavicon,
    execute,
  },
  {
    id: 'team-inbox-closed',
    type: 'recently-closed',
    title: 'Inbox — Team queue',
    url: 'https://mail.google.com/mail/u/0/#inbox/team',
    favIconUrl: mailFavicon,
    ageLabel: '5m',
    execute,
  },
  {
    id: 'help-inbox-history',
    type: 'history',
    title: 'Inbox — Project updates',
    url: 'https://mail.google.com/mail/u/0/#label/project-updates',
    favIconUrl: mailFavicon,
    ageLabel: '1h',
    execute,
  },
]
