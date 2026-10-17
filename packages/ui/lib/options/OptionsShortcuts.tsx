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
        bg-accent/[calc(var(--accent-strength)*1%)] text-foreground flex
        shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2
        text-sm font-medium transition-colors
        hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
        focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
        focus-visible:ring-offset-background focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2
      `,
    )}
  >
    <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
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
    return <span className="text-muted text-xs">Loading…</span>
  const value = formatShortcut(shortcut, isMac)
  return value ? (
    <KbdGroup>
      <Kbd>{value}</Kbd>
    </KbdGroup>
  ) : (
    <span className="text-muted text-xs">Not assigned</span>
  )
}

const LocalShortcuts = ({ isMac }: Pick<OptionsProps, 'isMac'>) => (
  <div className="grid gap-y-4">
    {tabManagerShortcutGroups(isMac).map(({ title, shortcuts }) => (
      <section key={title} aria-label={`${title} shortcuts`}>
        <p className="text-muted mb-1 text-xs font-medium">{title}</p>
        <dl className="divide-border/60 divide-y">
          {shortcuts.map(({ keys, label }) => (
            <div
              className={`
                grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5
              `}
              key={keys}
            >
              <dt className="text-foreground/90 min-w-0 text-xs leading-5">
                {label}
              </dt>
              <dd className="shrink-0">
                <KbdGroup>
                  <Kbd>{keys}</Kbd>
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
      'divide-border/60 divide-y',
      windowRows && 'border-border border-t pt-2',
    )}
  >
    {rows.map(({ id, name, shortcut }) => (
      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3',
          windowRows ? 'py-1.5' : 'py-2',
        )}
        key={id}
      >
        <dt className={cn(windowRows ? 'text-muted text-xs' : 'text-sm')}>
          {name}
        </dt>
        <dd>
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
    <div className="space-y-3">
      <div
        className={`
          flex flex-col gap-3
          group-data-[wide=true]/options:flex-row
          group-data-[wide=true]/options:items-start
          group-data-[wide=true]/options:justify-between
        `}
      >
        <p className="text-muted max-w-sm text-sm">
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
    <div className="mb-6 space-y-4">
      <section aria-labelledby={globalHeadingId}>
        <h2
          id={globalHeadingId}
          className="text-foreground mb-4 text-lg font-semibold"
        >
          Global shortcuts
        </h2>
        <div className="border-border bg-card rounded-lg border p-4">
          <ChromeShortcuts {...shortcutsProps} />
        </div>
      </section>
      <section aria-labelledby={tabManagerHeadingId}>
        <h2
          id={tabManagerHeadingId}
          className="text-foreground mb-4 text-lg font-semibold"
        >
          Tab manager shortcuts
        </h2>
        <div className="border-border bg-card rounded-lg border p-4">
          <LocalShortcuts isMac={isMac} />
        </div>
      </section>
    </div>
  )
}
