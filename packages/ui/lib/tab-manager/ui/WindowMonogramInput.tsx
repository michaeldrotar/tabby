import { getWindowIconValue } from '@extension/core/windowIconChoice'
import { useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { windowEditorInputClass } from './windowControls'

export const WindowMonogramInput = ({
  icon,
  onChoose,
}: {
  icon: string
  onChoose: (icon: string) => void
}) => {
  const [letters, setLetters] = useState(() => {
    const value = [...getWindowIconValue(icon)]
    return Array.from({ length: 3 }, (_, index) => value[index] ?? '')
  })
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const composing = useRef(false)
  const [composition, setComposition] = useState<{
    index: number
    text: string
  } | null>(null)
  const focus = (index: number) => {
    inputs.current[index]?.focus()
    inputs.current[index]?.select()
  }
  const update = (value: string[]) => {
    setLetters(value)
    onChoose(`monogram:${value.join('')}`)
  }
  const insert = (index: number, text: string) => {
    const characters = [...text.normalize('NFC').toUpperCase()]
      .filter((character) => /^[\p{L}\p{N}]$/u.test(character))
      .slice(0, 3 - index)
    if (!characters.length) return
    const value = [...letters]
    characters.forEach((character, offset) => {
      value[index + offset] = character
    })
    update(value)
    focus(Math.min(2, index + characters.length))
  }
  return (
    <div
      data-editor-row="monogram"
      className="flex min-h-0 flex-1 items-center"
    >
      <div
        role="group"
        aria-label="Monogram"
        className="mx-auto flex w-full max-w-66 gap-3"
      >
        {letters.map((letter, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element
            }}
            aria-label={`Monogram character ${index + 1}`}
            value={composition?.index === index ? composition.text : letter}
            autoComplete="off"
            spellCheck={false}
            className={cn(
              windowEditorInputClass,
              'mt-0 h-20 min-w-0 flex-1 px-0 text-center text-3xl font-semibold',
            )}
            onFocus={(event) => event.currentTarget.select()}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={(event) => {
              composing.current = false
              setComposition(null)
              insert(index, event.currentTarget.value)
            }}
            onChange={(event) => {
              if (composing.current) {
                setComposition({ index, text: event.target.value })
              } else if (!event.target.value) {
                update(
                  letters.map((value, offset) =>
                    offset === index ? '' : value,
                  ),
                )
              } else {
                const input = event.nativeEvent as InputEvent
                insert(
                  index,
                  input.inputType === 'insertText' && input.data !== null
                    ? input.data
                    : event.target.value,
                )
              }
            }}
            onPaste={(event) => {
              event.preventDefault()
              insert(index, event.clipboardData.getData('text'))
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                event.stopPropagation()
                focus(
                  Math.max(
                    0,
                    Math.min(2, index + (event.key === 'ArrowLeft' ? -1 : 1)),
                  ),
                )
              }
              if (event.key === 'Backspace' || event.key === 'Delete') {
                event.preventDefault()
                const destination =
                  event.key === 'Backspace' && !letter
                    ? Math.max(0, index - 1)
                    : index
                update(
                  letters.map((value, offset) =>
                    offset === destination ? '' : value,
                  ),
                )
                focus(destination)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
