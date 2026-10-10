import { formatShortcut } from '@extension/shared/utils/platform'
import { ExternalLinkIcon } from '../icons'
import { Kbd, KbdGroup } from '../Kbd'
import { cn } from '../utils/cn'
import type { OptionsProps } from './Options'

export const OptionsShortcuts = ({
  isMac,
  shortcutRows,
  shortcutsLoading,
  openShortcutsSettings,
}: Pick<
  OptionsProps,
  'isMac' | 'shortcutRows' | 'shortcutsLoading' | 'openShortcutsSettings'
>) => {
  const getShortcutLabel = (shortcut: string | undefined) =>
    shortcutsLoading
      ? 'Loading…'
      : (formatShortcut(shortcut, isMac) ?? 'Not assigned')
  return (
    <section className="mb-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Keyboard Shortcuts
      </h2>
      <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
        <div
          className={`
            flex flex-col gap-3
            group-data-[wide=true]/options:flex-row
            group-data-[wide=true]/options:items-start
            group-data-[wide=true]/options:justify-between
          `}
        >
          <p className="text-muted text-sm">
            Configure keyboard shortcuts to quickly access Tabby's features.
          </p>
          <button
            onClick={openShortcutsSettings}
            className={cn(
              `
                bg-accent/[calc(var(--accent-strength)*1%)] text-foreground flex
                shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4
                py-2 text-sm font-medium transition-colors
                hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                focus-visible:ring-offset-background focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-offset-2
              `,
            )}
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Open Shortcut Settings
          </button>
        </div>
        <div className={cn('mt-4 rounded-md p-4', 'bg-input/40')}>
          <h4 className="text-foreground mb-3 text-sm font-medium">
            Current Shortcuts
          </h4>
          <p className="text-muted mb-3 text-xs">
            These reflect the shortcuts currently assigned in Chrome.
          </p>
          <ul className="space-y-3 text-sm">
            {shortcutRows.map(({ id, name, description, shortcut }) => (
              <li key={id} className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <strong className="text-foreground">{name}</strong>
                  <p className="text-muted mt-0.5 text-xs">{description}</p>
                </div>
                <KbdGroup className="shrink-0 justify-end text-right">
                  <Kbd>{getShortcutLabel(shortcut)}</Kbd>
                </KbdGroup>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-3 text-xs">
            Window shortcut slots follow the order of windows shown in the Tab
            Manager. Assign any window shortcut in Chrome’s shortcut settings,
            or search “window 1” in the Omnibar.
          </p>
          {!isMac && (
            <p className="text-muted mt-3 text-xs">
              Note: Chrome reserves Ctrl+E for the address bar, so Tabby's
              default Windows/Linux search shortcut is Alt+E.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
