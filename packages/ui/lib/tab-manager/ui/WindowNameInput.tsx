import { useId, useState } from 'react'
import { cn } from '../../utils/cn'
import { windowControlClass, windowEditorInputClass } from './windowControls'
import type { RefObject } from 'react'

export const WindowNameInput = ({
  input,
  value,
  history,
  onChange,
}: {
  input: RefObject<HTMLInputElement | null>
  value: string
  history: readonly string[]
  onChange: (name: string) => void
}) => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [active, setActive] = useState(-1)
  const choices = history
    .filter((name) =>
      name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()),
    )
    .slice(0, 6)
  const expanded = open && choices.length > 0
  const choose = (name: string) => {
    onChange(name)
    setOpen(false)
    setActive(-1)
  }
  return (
    <div data-editor-row="name" className="relative text-sm">
      <label htmlFor={id}>Name</label>
      <input
        id={id}
        ref={input}
        data-window-name-input
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-choices` : undefined}
        aria-activedescendant={
          expanded && active >= 0 ? `${id}-${active}` : undefined
        }
        autoComplete="off"
        maxLength={120}
        value={value}
        onFocus={() => {
          setFilter('')
          setActive(-1)
          setOpen(true)
        }}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setFilter(event.target.value)
          setActive(-1)
          setOpen(true)
          onChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (['ArrowDown', 'ArrowUp'].includes(event.key) && choices.length) {
            event.preventDefault()
            event.stopPropagation()
            setOpen(true)
            setActive((index) =>
              event.key === 'ArrowDown'
                ? Math.min(index + 1, choices.length - 1)
                : Math.max(index - 1, 0),
            )
          } else if (event.key === 'Enter' && expanded && active >= 0) {
            event.preventDefault()
            event.stopPropagation()
            choose(choices[active]!)
          } else if (event.key === 'Escape' && expanded) {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
          }
        }}
        className={windowEditorInputClass}
      />
      {expanded && (
        <ul
          id={`${id}-choices`}
          role="listbox"
          aria-label="Previous window names"
          className="
            absolute inset-x-0 top-full z-10 mt-1 rounded-lg border
            border-border bg-background p-1 shadow-lg
          "
        >
          {choices.map((name, index) => (
            <li
              key={name}
              id={`${id}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(name)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  choose(name)
                }
              }}
              className={cn(
                windowControlClass,
                'cursor-pointer truncate',
                index === active && 'bg-highlighted/30',
              )}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
