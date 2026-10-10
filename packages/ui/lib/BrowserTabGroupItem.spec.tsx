// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrowserTabGroupItem } from './BrowserTabGroupItem'
import { BrowserTabList } from './BrowserTabList'
import { Surface } from './Surface'

afterEach(cleanup)
const nextFrame = () =>
  act(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  )
const items = [
  {
    type: 'group' as const,
    group: { id: 20, title: 'Reading', color: 'blue' as const },
    tabs: [],
  },
]

describe('controlled group rename', () => {
  it('mirrors a draft through both list renderers while only its physical owner focuses and restores focus', async () => {
    const complete = vi.fn()
    const Harness = () => {
      const [renaming, setRenaming] = useState(false)
      const [draft, setDraft] = useState('Reading')
      const listProps = {
        items,
        renamingGroupId: renaming ? 20 : null,
        renamingGroupTitle: draft,
        onGroupRenameTitleChange: (_group: unknown, title: string) =>
          setDraft(title),
        onGroupRenameCancel: () => setRenaming(false),
        onGroupRenameComplete: complete,
      }
      return (
        <>
          <button
            onClick={() => {
              setDraft('Staged title')
              setRenaming(true)
            }}
          >
            Stage rename
          </button>
          <section aria-label="Left">
            <Surface motion="reduced">
              {!renaming && (
                <button onClick={() => setRenaming(true)}>
                  Rename from menu
                </button>
              )}
              <BrowserTabList {...listProps} />
            </Surface>
          </section>
          <section aria-label="Right">
            <Surface motion="reduced">
              <BrowserTabList
                {...listProps}
                renderGroupItem={({
                  group,
                  isRenaming,
                  renameTitle,
                  onRenameTitleChange,
                  onRenameCancel,
                  onRenameComplete,
                }) => (
                  <BrowserTabGroupItem
                    groupId={group.id}
                    title={group.title}
                    isRenaming={isRenaming}
                    renameTitle={renameTitle}
                    onRenameTitleChange={onRenameTitleChange}
                    onRenameCancel={onRenameCancel}
                    onRenameComplete={onRenameComplete}
                  />
                )}
              />
            </Surface>
          </section>
        </>
      )
    }
    render(<Harness />)
    const left = within(screen.getByRole('region', { name: 'Left' }))
    const right = within(screen.getByRole('region', { name: 'Right' }))
    const menuAction = left.getByRole('button', { name: 'Rename from menu' })
    act(() => menuAction.focus())
    fireEvent.click(menuAction)
    const leftInput = left.getByRole('textbox') as HTMLInputElement
    const rightInput = right.getByRole('textbox') as HTMLInputElement
    await waitFor(() => expect(document.activeElement).toBe(leftInput))
    expect(rightInput.value).toBe('Reading')
    expect(leftInput.selectionStart).toBe(0)
    expect(leftInput.selectionEnd).toBe('Reading'.length)
    fireEvent.change(leftInput, { target: { value: 'Team planning' } })
    await nextFrame()
    expect(leftInput.value).toBe('Team planning')
    expect(rightInput.value).toBe('Team planning')
    expect(leftInput.selectionStart).toBe('Team planning'.length)
    fireEvent.keyDown(leftInput, { key: 'Escape' })
    const header = left.getByRole('button', { name: /Reading$/ })
    await waitFor(() => expect(document.activeElement).toBe(header))
    expect(right.queryByRole('textbox')).toBeNull()
    expect(complete).not.toHaveBeenCalled()

    const host = screen.getByRole('button', { name: 'Stage rename' })
    fireEvent.pointerDown(host)
    act(() => host.focus())
    fireEvent.click(host)
    await nextFrame()
    expect(document.activeElement).toBe(host)
    expect((left.getByRole('textbox') as HTMLInputElement).value).toBe(
      'Staged title',
    )
    expect((right.getByRole('textbox') as HTMLInputElement).value).toBe(
      'Staged title',
    )
  })

  it('restores scripted and still-frame drafts without focusing inputs or accepting rename keys', async () => {
    const cancel = vi.fn()
    const complete = vi.fn()
    const Harness = () => {
      const [draft, setDraft] = useState('First frame')
      return (
        <>
          <button onClick={() => setDraft('Restored frame')}>Next frame</button>
          {(['scripted', 'static'] as const).map((inputMode) => (
            <section key={inputMode} aria-label={inputMode}>
              <Surface inputMode={inputMode} motion="reduced">
                <BrowserTabList
                  items={items}
                  renamingGroupId={20}
                  renamingGroupTitle={draft}
                  onGroupRenameCancel={cancel}
                  onGroupRenameComplete={complete}
                />
              </Surface>
            </section>
          ))}
        </>
      )
    }
    render(<Harness />)
    const host = screen.getByRole('button', { name: 'Next frame' })
    act(() => host.focus())
    await nextFrame()
    expect(document.activeElement).toBe(host)
    fireEvent.click(host)
    for (const inputMode of ['scripted', 'static']) {
      const input = within(
        screen.getByRole('region', { name: inputMode }),
      ).getByRole('textbox', { hidden: true }) as HTMLInputElement
      expect(input.value).toBe('Restored frame')
      fireEvent.keyDown(input, { key: 'Enter' })
      fireEvent.keyDown(input, { key: 'Escape' })
    }
    await nextFrame()
    expect(document.activeElement).toBe(host)
    expect(cancel).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
  })
})
