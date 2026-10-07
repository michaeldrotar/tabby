import { t } from '@extension/i18n/i18n'
import { usePreferenceStorage } from '@extension/shared/hooks/preference'
import { getWindowIdentificationTab } from '@extension/shared/utils/window-identification'
import { Favicon } from '@extension/ui/Favicon'
import { ExternalLink, MonitorUp } from 'lucide-react'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'

type MoveToWindowPanelProps = {
  windows: readonly BrowserWindow[]
  tabs: readonly {
    active?: boolean
    index: number
    title?: string
    url?: string
    windowId: number
  }[]
  selectedTabIds: readonly number[]
  isMac: boolean
  newWindowDisabledReason?: string
  getWindowDisabledReason: (windowId: number) => string | undefined
  onMoveToNewWindow: () => void
  onMoveToWindow: (windowId: number) => void
}

const getWindowLabel = (window: BrowserWindow, isMac: boolean): string => {
  if (window.type === 'popup') return t('windowLabel_popup')
  if (window.type === 'devtools') return t('windowLabel_devtools')
  if (window.incognito)
    return isMac ? t('windowLabel_privateMac') : t('windowLabel_incognito')
  return t('windowLabel_default', String(window.id))
}

const itemClass = `
  text-popover-foreground flex w-full items-center gap-3 px-3 py-2
  text-sm transition-colors
  hover:bg-highlighted/50
  focus-visible:bg-highlighted/50 focus-visible:outline-none
  disabled:cursor-not-allowed disabled:opacity-45
`

export const MoveToWindowPanel = ({
  windows,
  tabs,
  selectedTabIds,
  isMac,
  newWindowDisabledReason,
  getWindowDisabledReason,
  onMoveToNewWindow,
  onMoveToWindow,
}: MoveToWindowPanelProps) => {
  const newWindowDisabled = Boolean(newWindowDisabledReason)
  const { tabManagerCompactIconMode: identificationMode } =
    usePreferenceStorage()
  const tabsByWindowId = new Map<number, (typeof tabs)[number][]>()

  for (const tab of tabs) {
    const windowTabs = tabsByWindowId.get(tab.windowId) ?? []
    windowTabs.push(tab)
    tabsByWindowId.set(tab.windowId, windowTabs)
  }

  return (
    <div className="py-1">
      <button
        type="button"
        disabled={newWindowDisabled}
        title={newWindowDisabledReason}
        onClick={onMoveToNewWindow}
        className={itemClass}
      >
        <span className="text-muted flex-shrink-0">
          <ExternalLink size={16} />
        </span>
        <span className="flex-1 text-left">
          {t('tabContextMenu_newWindow')} · {selectedTabIds.length}
        </span>
      </button>
      {windows.length > 0 && <div className="bg-border mx-2 my-1 h-px" />}
      {windows.map((window) => {
        const disabledReason = getWindowDisabledReason(window.id)
        const identificationTab = getWindowIdentificationTab(
          tabsByWindowId.get(window.id) ?? [],
          identificationMode,
        )
        const label = identificationTab?.title || getWindowLabel(window, isMac)
        return (
          <button
            key={window.id}
            type="button"
            disabled={Boolean(disabledReason)}
            title={disabledReason}
            onClick={() => onMoveToWindow(window.id)}
            className={itemClass}
          >
            <span className="text-muted flex-shrink-0">
              {identificationTab?.url ? (
                <Favicon pageUrl={identificationTab.url} size={16} alt="" />
              ) : (
                <MonitorUp size={16} />
              )}
            </span>
            <span className="flex-1 truncate text-left">
              {label} · {selectedTabIds.length}
            </span>
          </button>
        )
      })}
    </div>
  )
}
