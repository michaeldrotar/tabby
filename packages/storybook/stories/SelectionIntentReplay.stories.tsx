import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { BrowserTabList } from '@extension/ui/BrowserTabList'
import { createElement, useCallback, useMemo, useRef, useState } from 'react'
import {
  resolveSelectedTabIds,
  runBatchClose,
  runBatchCreateGroup,
  runBatchMoveToNewWindow,
  runBatchTabAction,
} from '../../../pages/tab-manager/src/actions/batchTabActions'
import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
  reduceSelectionIntent,
} from '../../../pages/tab-manager/src/selection/SelectionModel'
import type {
  BatchTabActionPorts,
  BatchTabActionResult,
} from '../../../pages/tab-manager/src/actions/batchTabActions'
import type {
  SelectionIntent,
  SelectionItemRef,
  SelectionModelContext,
  SelectionModelState,
} from '../../../pages/tab-manager/src/selection/SelectionModel'
import type { BrowserTabListItemData } from '@extension/ui/BrowserTabList'
import type { Decorator, Meta } from '@storybook/react'

const demoItems: BrowserTabListItemData[] = [
  {
    type: 'group',
    group: { id: 301, title: 'Project research', color: 'blue' },
    tabs: [
      {
        id: 11,
        title: 'Product brief',
        url: 'https://example.com/brief',
      },
      {
        id: 12,
        title: 'Issue #24 · Batch actions',
        url: 'https://github.com/michaeldrotar/tabby/issues/24',
      },
    ],
  },
  {
    type: 'tab',
    tab: {
      id: 13,
      title: 'Chrome tabs API',
      url: 'https://developer.chrome.com/docs/extensions/reference/api/tabs',
    },
  },
  {
    type: 'group',
    group: {
      id: 302,
      title: 'Later reading',
      color: 'orange',
      collapsed: true,
    },
    tabs: [
      {
        id: 15,
        title: 'Keyboard interaction notes',
        url: 'https://example.com/keyboard-notes',
      },
      {
        id: 16,
        title: 'Testing checklist',
        url: 'https://example.com/testing-checklist',
      },
    ],
  },
  {
    type: 'tab',
    tab: {
      id: 17,
      title: 'Release notes',
      url: 'https://example.com/release-notes',
    },
  },
]

const visibleOrder: SelectionItemRef[] = [
  { type: 'group', id: 301 },
  { type: 'tab', id: 11 },
  { type: 'tab', id: 12 },
  { type: 'tab', id: 13 },
  { type: 'group', id: 302 },
  { type: 'tab', id: 17 },
]

const windowOrder: SelectionItemRef[] = [
  { type: 'window', id: 1 },
  { type: 'window', id: 2 },
]

const snapshot = {
  tabs: [
    { id: 11, windowId: 1, index: 0, groupId: 301, active: true },
    { id: 12, windowId: 1, index: 1, groupId: 301 },
    { id: 13, windowId: 1, index: 2 },
    { id: 15, windowId: 1, index: 3, groupId: 302 },
    { id: 16, windowId: 1, index: 4, groupId: 302 },
    { id: 17, windowId: 1, index: 5 },
    { id: 21, windowId: 2, index: 0, active: true },
    { id: 22, windowId: 2, index: 1 },
  ],
  windows: [
    { id: 1, type: 'normal', incognito: false },
    { id: 2, type: 'normal', incognito: false },
  ],
  groups: [
    { id: 301, windowId: 1 },
    { id: 302, windowId: 1 },
  ],
}

const demoPorts: BatchTabActionPorts = {
  closeTab: async () => {},
  moveTab: async () => {},
  moveFirstTabToNewWindow: async () => 2,
  addTabToGroup: async () => {},
  createGroupWithTab: async () => 900,
  performTabAction: async () => {},
  performWindowAction: async () => {},
  performGroupAction: async () => {},
  writeClipboardText: async () => {},
}

const mouseScript: SelectionIntent[] = [
  {
    type: 'click',
    item: { type: 'tab', id: 11 },
    pane: 'tab',
    shift: false,
    toggle: false,
    orderedItems: visibleOrder,
  },
  {
    type: 'click',
    item: { type: 'tab', id: 13 },
    pane: 'tab',
    shift: true,
    toggle: false,
    orderedItems: visibleOrder,
  },
  {
    type: 'click',
    item: { type: 'tab', id: 17 },
    pane: 'tab',
    shift: false,
    toggle: true,
    orderedItems: visibleOrder,
  },
]

const keyboardScript: SelectionIntent[] = [
  { type: 'arrow', item: { type: 'tab', id: 11 }, pane: 'tab' },
  { type: 'arrow', item: { type: 'tab', id: 12 }, pane: 'tab' },
  { type: 'space', item: { type: 'tab', id: 12 }, pane: 'tab' },
  { type: 'space', item: { type: 'tab', id: 17 }, pane: 'tab' },
]

const mouseWindowScript: SelectionIntent[] = [
  {
    type: 'click',
    item: { type: 'window', id: 1 },
    pane: 'window',
    shift: false,
    toggle: false,
    orderedItems: windowOrder,
  },
  {
    type: 'click',
    item: { type: 'window', id: 2 },
    pane: 'window',
    shift: false,
    toggle: true,
    orderedItems: windowOrder,
  },
]

const keyboardWindowScript: SelectionIntent[] = [
  { type: 'arrow', item: { type: 'window', id: 1 }, pane: 'window' },
  { type: 'space', item: { type: 'window', id: 1 }, pane: 'window' },
  { type: 'arrow', item: { type: 'window', id: 2 }, pane: 'window' },
  { type: 'space', item: { type: 'window', id: 2 }, pane: 'window' },
]

const emptyModel = (): SelectionModelContext => ({
  selection: {
    ...createEmptySelectionSnapshot(),
    mode: 'default',
  },
  interaction: createSelectionInteractionState(),
})

const initialSelection = (selection: SelectionModelState) => ({
  windowIds: selection.windowIds,
  expandedWindowIds: selection.expandedWindowIds,
  groupIds: selection.groupIds,
  tabIds: selection.tabIds,
})

const decorator: Decorator = (Story) => (
  <div className="mx-auto w-[390px] max-w-full p-5">
    <Story />
  </div>
)

const meta = {
  title: 'Tab Manager/Selection intent replay',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

const SelectionIntentReplay = () => {
  const [model, setModel] = useState<SelectionModelContext>(emptyModel)
  const [scriptLabel, setScriptLabel] = useState(
    'Click a row or replay an intent sequence.',
  )
  const [actionLabel, setActionLabel] = useState('No action replayed yet.')
  const playbackId = useRef(0)
  const selectedTabIds = useMemo(
    () =>
      new Set(
        resolveSelectedTabIds(initialSelection(model.selection), snapshot),
      ),
    [model.selection],
  )

  const dispatch = useCallback((intent: SelectionIntent) => {
    setModel((current) => reduceSelectionIntent(current, intent))
  }, [])

  const play = useCallback(
    async (label: string, intents: SelectionIntent[]) => {
      const runId = ++playbackId.current
      setModel(emptyModel())
      setScriptLabel(`${label} sequence running…`)
      for (let index = 0; index < intents.length; index += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 380))
        if (runId !== playbackId.current) return
        const intent = intents[index]
        if (intent) dispatch(intent)
      }
      if (runId === playbackId.current) {
        setScriptLabel(`${label} sequence complete.`)
      }
    },
    [dispatch],
  )

  const handleTabClick = useCallback(
    (tab: { id: number | string }, event: React.MouseEvent) => {
      dispatch({
        type: 'click',
        item: { type: 'tab', id: Number(tab.id) },
        pane: 'tab',
        shift: event.shiftKey,
        toggle: event.metaKey || event.ctrlKey,
        orderedItems: visibleOrder,
      })
      setScriptLabel('Live mouse input uses the same selection reducer.')
    },
    [dispatch],
  )

  const handleGroupClick = useCallback(
    (group: { id: number | string }, event: React.MouseEvent) => {
      dispatch({
        type: 'click',
        item: { type: 'group', id: Number(group.id) },
        pane: 'tab',
        shift: event.shiftKey,
        toggle: event.metaKey || event.ctrlKey,
        orderedItems: visibleOrder,
      })
      setScriptLabel('Live mouse input uses the same selection reducer.')
    },
    [dispatch],
  )

  const handleWindowClick = useCallback(
    (windowId: number, event: React.MouseEvent<HTMLButtonElement>) => {
      dispatch({
        type: 'click',
        item: { type: 'window', id: windowId },
        pane: 'window',
        shift: event.shiftKey,
        toggle: event.metaKey || event.ctrlKey,
        orderedItems: windowOrder,
      })
      setScriptLabel('Live window input uses the same selection reducer.')
    },
    [dispatch],
  )

  const handleReset = () => {
    playbackId.current += 1
    setModel(emptyModel())
    setScriptLabel('Selection reset.')
    setActionLabel('No action replayed yet.')
  }

  const closeCount = selectedTabIds.size

  const replayAction = async (
    label: string,
    run: (tabIds: readonly number[]) => Promise<BatchTabActionResult>,
  ) => {
    const requestedIds = [...selectedTabIds]
    if (requestedIds.length === 0) return
    setActionLabel(`${label} running…`)
    const result = await run(requestedIds)
    setActionLabel(
      `${label}: ${result.succeededIds.length} of ${result.requestedIds.length} tabs succeeded${
        result.failures.length > 0 ? `; ${result.failures.length} failed` : ''
      }.`,
    )
  }

  return (
    <section
      className={`
        bg-background text-foreground overflow-hidden rounded-xl border
        shadow-lg
      `}
    >
      <header className="border-border flex flex-col gap-3 border-b p-4">
        <div>
          <p
            className={`
              text-accent mb-1 text-[10px] font-bold uppercase tracking-[.18em]
            `}
          >
            Input-independent demo
          </p>
          <h2 className="text-lg font-semibold">Batch selection replay</h2>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Play a normalized mouse or keyboard sequence, then change the list
            directly. Both paths use the production selection reducer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void play('Mouse', mouseScript)}
            className={`
              bg-accent/10 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-accent/20
            `}
          >
            Replay mouse
          </button>
          <button
            type="button"
            onClick={() => void play('Keyboard', keyboardScript)}
            className={`
              bg-accent/10 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-accent/20
            `}
          >
            Replay keyboard
          </button>
          <button
            type="button"
            onClick={() => void play('Mouse window', mouseWindowScript)}
            className={`
              bg-accent/10 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-accent/20
            `}
          >
            Replay window modifiers
          </button>
          <button
            type="button"
            onClick={() => void play('Keyboard window', keyboardWindowScript)}
            className={`
              bg-accent/10 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-accent/20
            `}
          >
            Replay keyboard windows
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={`
              bg-highlighted/50 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-highlighted
            `}
          >
            Reset
          </button>
        </div>
        <p className="text-muted text-xs" role="status" aria-live="polite">
          {scriptLabel}
        </p>
        <div className="flex flex-wrap gap-2 border-t pt-3">
          <button
            type="button"
            disabled={closeCount === 0}
            onClick={() =>
              void replayAction('Close', (tabIds) =>
                runBatchClose(tabIds, demoPorts),
              )
            }
            className={`
              bg-highlighted/50 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-highlighted
              disabled:opacity-40
            `}
          >
            Simulate close
          </button>
          <button
            type="button"
            disabled={closeCount === 0}
            onClick={() =>
              void replayAction('Move to new window', (tabIds) =>
                runBatchMoveToNewWindow(tabIds, demoPorts),
              )
            }
            className={`
              bg-highlighted/50 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-highlighted
              disabled:opacity-40
            `}
          >
            Simulate move
          </button>
          <button
            type="button"
            disabled={closeCount === 0}
            onClick={() =>
              void replayAction('Create group', (tabIds) =>
                runBatchCreateGroup(tabIds, 1, demoPorts),
              )
            }
            className={`
              bg-highlighted/50 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-highlighted
              disabled:opacity-40
            `}
          >
            Simulate group
          </button>
          <button
            type="button"
            disabled={closeCount === 0}
            onClick={() =>
              void replayAction('Pin', (tabIds) =>
                runBatchTabAction(tabIds, 'pin', demoPorts),
              )
            }
            className={`
              bg-highlighted/50 rounded-md px-3 py-2 text-xs font-medium
              hover:bg-highlighted
              disabled:opacity-40
            `}
          >
            Simulate pin
          </button>
        </div>
        <p className="text-muted text-xs" role="status" aria-live="polite">
          {actionLabel} These actions use fake ports; Chrome is not called.
        </p>
      </header>

      <div className="p-3">
        <div className="mb-3 space-y-1 rounded-lg border p-2">
          <p
            className={`
              text-muted px-2 text-[10px] font-bold uppercase tracking-wider
            `}
          >
            Simulated window rail
          </p>
          {[
            { id: 1, title: 'Window Alpha', tabCount: 6 },
            { id: 2, title: 'Window Beta', tabCount: 2 },
          ].map((window) => (
            <button
              key={window.id}
              type="button"
              aria-pressed={model.selection.windowIds.has(window.id)}
              onClick={(event) => handleWindowClick(window.id, event)}
              className={`
                flex w-full items-center justify-between rounded-md px-2 py-2
                text-left text-xs
                ${
                  model.selection.windowIds.has(window.id)
                    ? 'bg-accent/15 text-foreground'
                    : 'hover:bg-highlighted/40'
                }
              `}
            >
              <span>{window.title}</span>
              <span className="text-muted">
                {model.selection.expandedWindowIds.has(window.id)
                  ? `${window.tabCount} tabs selected`
                  : model.selection.windowIds.has(window.id)
                    ? 'active tab only'
                    : `${window.tabCount} tabs`}
              </span>
            </button>
          ))}
          <p className="text-muted px-2 text-[10px]">
            Click selects the active tab; Shift/Cmd/Ctrl-click selects every tab
            in the chosen windows.
          </p>
        </div>
        <BrowserTabList
          items={demoItems}
          selectedTabIds={selectedTabIds}
          selectedGroupIds={new Set(model.selection.groupIds)}
          isMultiSelectMode={model.selection.mode === 'multi-select'}
          onTabClick={handleTabClick}
          onGroupSelect={handleGroupClick}
          renderTabItem={({
            tab,
            selected,
            isMultiSelectMode: multi,
            onClick,
          }) => (
            <BrowserTabItem
              tabId={tab.id}
              title={tab.title}
              url={tab.url}
              favicon={createElement('span', {
                className: 'bg-accent/50 block size-4 rounded-sm',
                'aria-hidden': true,
              })}
              selected={selected}
              isMultiSelectMode={multi}
              onClick={onClick}
            />
          )}
        />
      </div>

      <footer
        className={`
          border-border bg-highlighted/20 flex items-center justify-between
          gap-3 border-t px-4 py-3 text-xs
        `}
      >
        <span>
          <b>{selectedTabIds.size}</b>{' '}
          {selectedTabIds.size === 1 ? 'tab' : 'tabs'} ·{' '}
          <b>{model.selection.windowIds.size}</b>{' '}
          {model.selection.windowIds.size === 1 ? 'window' : 'windows'} ·{' '}
          <b>{model.selection.groupIds.size}</b>{' '}
          {model.selection.groupIds.size === 1 ? 'group' : 'groups'} selected
        </span>
        <span className="text-muted">
          {closeCount > 0
            ? `${closeCount} ready for a shared action`
            : 'No tabs selected'}
        </span>
      </footer>
    </section>
  )
}

export const InteractiveReplay = {
  decorators: [decorator],
  render: () => <SelectionIntentReplay />,
}
