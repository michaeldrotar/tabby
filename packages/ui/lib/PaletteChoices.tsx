import { useState } from 'react'
import { cn } from './utils/cn'

const adjacentRowIndex = (button: HTMLButtonElement, direction: number) => {
  const current = button.getBoundingClientRect()
  const choices = Array.from(
    button.parentElement!.querySelectorAll<HTMLButtonElement>(
      '[data-palette-choice]',
    ),
  )
  const candidates = choices
    .map((element, index) => {
      const rect = element.getBoundingClientRect()
      return {
        index,
        vertical: (rect.top - current.top) * direction,
        horizontal: Math.abs(
          rect.left + rect.width / 2 - (current.left + current.width / 2),
        ),
      }
    })
    .filter(({ vertical }) => vertical > 1)
    .sort((a, b) => a.vertical - b.vertical || a.horizontal - b.horizontal)
  return candidates[0]?.index ?? choices.indexOf(button)
}

export const PaletteChoices = ({
  label,
  value,
  palettes,
  swatches,
  onChange,
}: {
  label: string
  value: string
  palettes: readonly string[]
  swatches: Record<string, string>
  onChange: (value: string) => void
}) => {
  const [focused, setFocused] = useState<string | null>(null)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-palette-choices
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null)
      }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span data-palette-value className="text-muted capitalize">
          {value}
        </span>
      </div>
      <div data-palette-grid>
        {palettes.map((palette, index) => (
          <button
            key={palette}
            type="button"
            role="radio"
            aria-label={palette}
            data-palette-choice
            aria-checked={value === palette}
            tabIndex={(focused ?? value) === palette ? 0 : -1}
            onFocus={() => setFocused(palette)}
            onClick={() => onChange(palette)}
            onKeyDown={(event) => {
              let next: number
              switch (event.key) {
                case 'ArrowDown':
                case 'ArrowUp':
                  next = adjacentRowIndex(
                    event.currentTarget,
                    event.key === 'ArrowDown' ? 1 : -1,
                  )
                  break
                case 'ArrowRight':
                  next = (index + 1) % palettes.length
                  break
                case 'ArrowLeft':
                  next = (index - 1 + palettes.length) % palettes.length
                  break
                case 'Home':
                  next = 0
                  break
                case 'End':
                  next = palettes.length - 1
                  break
                default:
                  return
              }
              event.preventDefault()
              const target = event.currentTarget.parentElement?.children[
                next
              ] as HTMLButtonElement | undefined
              target?.focus()
              onChange(palettes[next]!)
            }}
          >
            <span
              aria-hidden="true"
              data-palette-swatch
              className={cn(
                'h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/10',
                swatches[palette],
              )}
            />
            <span data-palette-name aria-hidden="true">
              {palette}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
