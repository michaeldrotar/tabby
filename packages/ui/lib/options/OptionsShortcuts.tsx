import { formatShortcut } from '@extension/shared/utils/platform'
import { useId } from 'react'
import { ExternalLinkIcon } from '../icons'
import { Kbd, KbdGroup } from '../Kbd'
import { cn } from '../utils/cn'
import type { OptionsProps } from './Options'

type TabManagerShortcut = {
  keys: string
  label: string
}

const tabManagerShortcutGroups = (isMac: boolean) =>
  [
    {
      title: 'Navigate',
      shortcuts: [
        { keys: 'Tab / Shift+Tab', label: 'Move between sections' },
        { keys: '↑ / ↓ · Home / End', label: 'Navigate items' },
        { keys: '← / →', label: 'Navigate header and tools' },
        { keys: 'Enter', label: 'Open tab, choose window, or toggle group' },
        { keys: 'Escape', label: 'Select active tab or dismiss menus' },
      ],
    },
    {
      title: 'Select',
      shortcuts: [
        { keys: 'Space', label: 'Toggle selection' },
        { keys: 'Shift+↑/↓', label: 'Extend selection' },
        {
          keys: isMac ? '⌘+A' : 'Ctrl+A',
          label: 'Select all tabs in this window',
        },
        { keys: 'Delete / Backspace', label: 'Close selection or item' },
        { keys: 'Menu / Shift+Enter / Shift+F10', label: 'Open actions' },
      ],
    },
    {
      title: 'Organize',
      shortcuts: [
        {
          keys: isMac ? 'Option+↑/↓' : 'Alt+↑/↓',
          label: 'Reorder tab or group',
        },
        { keys: 'F2', label: 'Rename group' },
      ],
    },
  ] satisfies { title: string; shortcuts: TabManagerShortcut[] }[]

const ShortcutSettingsButton = ({
  openShortcutsSettings,
}: Pick<OptionsProps, 'openShortcutsSettings'>) => (
  <button
    type="button"
    onClick={openShortcutsSettings}
    className={cn(
      `
        flex shrink-0 items-center gap-2 rounded-lg bg-accent-selected px-3 py-2
        text-base font-medium whitespace-normal text-foreground
        transition-colors
        hover:bg-accent-selected-hover
        focus-visible:ring-2 focus-visible:ring-accent
        focus-visible:ring-offset-2 focus-visible:ring-offset-background
        focus-visible:outline-hidden
      `,
    )}
  >
    <ExternalLinkIcon className="size-4" aria-hidden="true" />
    Open Chrome shortcut settings
  </button>
)

const ShortcutValue = ({
  shortcut,
  isMac,
  shortcutsLoading,
}: {
  shortcut: string | undefined
  isMac: boolean
  shortcutsLoading: boolean
}) => {
  if (shortcutsLoading)
    return <span className="text-sm text-muted">Loading…</span>
  const value = formatShortcut(shortcut, isMac)
  return value ? (
    <KbdGroup className="max-w-full">
      <Kbd className="h-auto min-h-6 max-w-full py-1 text-sm whitespace-normal">
        {value}
      </Kbd>
    </KbdGroup>
  ) : (
    <span className="text-sm text-muted">Not assigned</span>
  )
}

const LocalShortcuts = ({ isMac }: Pick<OptionsProps, 'isMac'>) => (
  <div className="grid gap-y-4">
    {tabManagerShortcutGroups(isMac).map(({ title, shortcuts }) => (
      <section key={title} aria-label={`${title} shortcuts`}>
        <h3 className="mb-2 text-xl font-medium text-foreground">{title}</h3>
        <dl className="shortcut-dividers">
          {shortcuts.map(({ keys, label }) => (
            <div
              className={`
                grid grid-cols-1 items-center gap-2 py-1.5
                group-data-[wide=true]/options:grid-cols-[minmax(0,1fr)_auto]
              `}
              key={keys}
            >
              <dt className="min-w-0 text-base/6 text-foreground/90">
                {label}
              </dt>
              <dd className="min-w-0">
                <KbdGroup className="max-w-full">
                  <Kbd
                    className={`
                      h-auto min-h-6 max-w-full py-1 text-sm whitespace-normal
                    `}
                  >
                    {keys}
                  </Kbd>
                </KbdGroup>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    ))}
  </div>
)

type ShortcutRow = OptionsProps['shortcutRows'][number]

const ShortcutRows = ({
  rows,
  isMac,
  shortcutsLoading,
  windowRows = false,
}: {
  rows: readonly ShortcutRow[]
  isMac: boolean
  shortcutsLoading: boolean
  windowRows?: boolean
}) => (
  <dl
    className={cn(
      'shortcut-dividers',
      windowRows && 'border-t border-border pt-2',
    )}
  >
    {rows.map(({ id, name, shortcut }) => (
      <div
        className={cn(
          `
            grid grid-cols-1 items-center gap-3
            group-data-[wide=true]/options:grid-cols-[minmax(0,1fr)_auto]
          `,
          windowRows ? 'py-1.5' : 'py-2',
        )}
        key={id}
      >
        <dt className={cn(windowRows ? 'text-base text-muted' : 'text-base')}>
          {name}
        </dt>
        <dd className="min-w-0">
          <ShortcutValue
            shortcut={shortcut}
            isMac={isMac}
            shortcutsLoading={shortcutsLoading}
          />
        </dd>
      </div>
    ))}
  </dl>
)

const ChromeShortcuts = ({
  isMac,
  shortcutRows,
  shortcutsLoading = false,
  openShortcutsSettings,
}: Pick<
  OptionsProps,
  'isMac' | 'shortcutRows' | 'shortcutsLoading' | 'openShortcutsSettings'
>) => {
  const generalRows = shortcutRows.filter(
    ({ id }) => !id.startsWith('focus-window-'),
  )
  const windowRows = shortcutRows.filter(({ id }) =>
    id.startsWith('focus-window-'),
  )

  return (
    <div className="stack-y-3">
      <div
        className={`
          flex flex-col gap-3
          group-data-[wide=true]/options:flex-row
          group-data-[wide=true]/options:items-start
          group-data-[wide=true]/options:justify-between
        `}
      >
        <p className="max-w-sm text-base text-muted">
          These shortcuts work across Chrome and are managed in Chrome settings.
        </p>
        <ShortcutSettingsButton openShortcutsSettings={openShortcutsSettings} />
      </div>
      <ShortcutRows
        rows={generalRows}
        isMac={isMac}
        shortcutsLoading={shortcutsLoading}
      />
      {windowRows.length > 0 && (
        <ShortcutRows
          rows={windowRows}
          isMac={isMac}
          shortcutsLoading={shortcutsLoading}
          windowRows
        />
      )}
    </div>
  )
}

export const OptionsShortcuts = ({
  isMac,
  shortcutRows,
  shortcutsLoading = false,
  openShortcutsSettings,
}: Pick<
  OptionsProps,
  'isMac' | 'shortcutRows' | 'shortcutsLoading' | 'openShortcutsSettings'
>) => {
  const globalHeadingId = useId()
  const tabManagerHeadingId = useId()
  const shortcutsProps = {
    isMac,
    shortcutRows,
    shortcutsLoading,
    openShortcutsSettings,
  }

  return (
    <div className="stack-y-4 mb-6">
      <section aria-labelledby={globalHeadingId}>
        <h2
          id={globalHeadingId}
          className="mb-4 text-2xl font-semibold text-foreground"
        >
          Global shortcuts
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <ChromeShortcuts {...shortcutsProps} />
        </div>
      </section>
      <section aria-labelledby={tabManagerHeadingId}>
        <h2
          id={tabManagerHeadingId}
          className="mb-4 text-2xl font-semibold text-foreground"
        >
          Tab manager shortcuts
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <LocalShortcuts isMac={isMac} />
        </div>
      </section>
    </div>
  )
}
