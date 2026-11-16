import { useLayoutEffect, useRef } from 'react'
import { CheckIcon } from '../icons'
import { Kbd } from '../Kbd'
import { cn } from '../utils/cn'
import { omnibarScopeEntries } from './omnibarScopes'
import { scrollOmnibarItemIntoView } from './scrollOmnibarItemIntoView'
import type { OmnibarScope } from '@extension/core'

export const scopeLetters: Record<OmnibarScope, string> = {
  all: 'a',
  'current-window': 'd',
  tabs: 't',
  bookmarks: 'b',
  history: 'h',
  'recently-closed': 'r',
  windows: 'w',
  'tab-groups': 'g',
  commands: 'c',
}

export const OmnibarScopeChoices = ({
  id,
  scope,
  highlighted,
  onHighlight,
  onChange,
}: {
  id: string
  scope: OmnibarScope
  highlighted: OmnibarScope
  onHighlight: (scope: OmnibarScope) => void
  onChange: (scope: OmnibarScope) => void
}) => {
  const highlightedItem = useRef<HTMLButtonElement>(null)
  useLayoutEffect(
    () => scrollOmnibarItemIntoView(highlightedItem.current),
    [highlighted],
  )
  return (
    <div
      id={id}
      role="listbox"
      aria-label="Search scope"
      data-omnibar-scope-list
      className="p-1"
    >
      {omnibarScopeEntries.map(([value, item]) => (
        <button
          key={value}
          ref={value === highlighted ? highlightedItem : undefined}
          id={`${id}-${value}`}
          type="button"
          role="option"
          tabIndex={-1}
          aria-selected={value === highlighted}
          onMouseMove={() => onHighlight(value)}
          onClick={() => onChange(value)}
          className={cn(
            `
              flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left
              text-sm text-foreground
            `,
            value === highlighted
              ? 'bg-accent-selected'
              : 'hover:bg-accent-hover',
          )}
        >
          <item.icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {value === scope && (
            <CheckIcon aria-hidden="true" className="size-3.5 text-muted" />
          )}
          <Kbd className="ml-2 text-xs text-muted">
            {scopeLetters[value].toUpperCase()}
          </Kbd>
        </button>
      ))}
    </div>
  )
}
