import {
  defaultWindowIcon,
  getWindowIconChoices,
  getWindowIconKind,
  getWindowIconValue,
  SUGGESTED_WINDOW_ICONS,
} from '@extension/core/windowIconChoice'
import { WINDOW_ICONS } from '@extension/core/windowIcons'
import { ImagePlus, Search } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import {
  getGroupColorClasses,
  TAB_GROUP_COLOR_IDS,
} from '../../tab-group/tabGroupColors'
import { cn } from '../../utils/cn'
import {
  editorRowEntry,
  windowControlClass,
  windowEditorInputClass,
} from './windowControls'
import { WindowIcon } from './WindowIcon'
import { windowIconImage } from './windowIconImage'
import { WindowMonogramInput } from './WindowMonogramInput'
import type { TabManagerIntent, TabManagerViewModel } from '../TabManager'
import type {
  WINDOW_EMOJI_CHOICES,
  WINDOW_EMOJI_LABELS,
} from './windowEmojiChoices'
import type { BrowserTabGroupColor } from '@extension/core'
import type { WindowIconKind } from '@extension/core/windowIconChoice'
import type { KeyboardEvent } from 'react'

const control = cn(windowControlClass, 'gap-0 px-0')
const choiceClass = cn(control, 'h-10 min-w-0')
const gridClass = 'grid content-start gap-1'
const field = windowEditorInputClass
const types: { id: WindowIconKind; label: string }[] = [
  { id: 'icon', label: 'Icon' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'monogram', label: 'Monogram' },
  { id: 'upload', label: 'Upload' },
  { id: 'favicon', label: 'Favicons' },
]
const suggestedEmojis = [
  '😀',
  '😎',
  '🥳',
  '🤓',
  '🐱',
  '🐶',
  '🦊',
  '🐼',
  '🌿',
  '🌻',
  '🌈',
  '☀️',
  '🌙',
  '⭐',
  '🔥',
  '⚡',
  '❤️',
  '💜',
  '💡',
  '🎨',
  '🎵',
  '🎮',
  '🚀',
  '✈️',
  '🏠',
  '📚',
  '💻',
  '🔬',
  '☕',
  '🍕',
  '🎯',
  '🎁',
].map((emoji) => `emoji:${emoji}`)
const label = (icon: string) =>
  icon.charAt(0).toUpperCase() + icon.slice(1).replaceAll('-', ' ')

const WindowIconGrid = ({
  choices,
  kind,
  titles,
  loading = false,
  results = false,
  hidden = false,
  selected,
  color,
  columns,
  onChoose,
  onKeyDown,
}: {
  choices: readonly string[]
  kind: 'icon' | 'emoji'
  titles?: ReadonlyMap<string, string>
  loading?: boolean
  results?: boolean
  hidden?: boolean
  selected?: string
  color?: BrowserTabGroupColor
  columns: number
  onChoose: (icon: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}) => (
  <div
    data-editor-row={!hidden ? 'icons' : undefined}
    data-icon-grid
    role="toolbar"
    aria-label={
      kind === 'icon'
        ? results
          ? 'Matching icons'
          : 'Suggested icons'
        : results
          ? 'Matching emoji'
          : 'Suggested emoji'
    }
    aria-hidden={hidden ? true : undefined}
    inert={hidden ? true : undefined}
    onKeyDown={onKeyDown}
    className={cn(
      gridClass,
      results &&
        `
          absolute inset-0 z-10 overflow-y-auto rounded-md border border-border
          bg-popover shadow-lg
        `,
    )}
    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
  >
    {choices.map((icon, index) => (
      <button
        key={icon}
        type="button"
        aria-label={
          kind === 'icon'
            ? `${label(icon)} icon`
            : `Use ${getWindowIconValue(icon)}`
        }
        title={titles?.get(icon) ?? label(icon)}
        aria-pressed={selected === icon}
        tabIndex={
          (choices.includes(selected ?? '') ? selected === icon : index === 0)
            ? 0
            : -1
        }
        className={cn(
          choiceClass,
          selected === icon &&
            'bg-accent-selected ring-2 ring-focus ring-inset',
        )}
        onClick={() => onChoose(icon)}
      >
        <WindowIcon icon={icon} color={color ?? 'blue'} />
      </button>
    ))}
    {results && !choices.length && (
      <p role="status" className="col-span-full p-3 text-sm text-muted">
        {loading
          ? 'Loading emoji…'
          : `No ${kind === 'icon' ? 'icons' : 'emoji'} found. Try another search.`}
      </p>
    )}
  </div>
)

export const WindowIconPicker = ({
  model,
  onIntent,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
}) => {
  const draft = model.editingWindow!
  const kind = getWindowIconKind(draft.icon)
  const choices = getWindowIconChoices(draft.icon, draft.iconChoices)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [emojiCatalog, setEmojiCatalog] = useState<typeof WINDOW_EMOJI_CHOICES>(
    [],
  )
  const [emojiLabels, setEmojiLabels] = useState<typeof WINDOW_EMOJI_LABELS>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedFavicon, setSelectedFavicon] = useState('')
  const [columns, setColumns] = useState(8)
  const region = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const upload = useRef<HTMLInputElement>(null)
  const request = useRef(0)
  const id = useId()
  useEffect(
    () => () => {
      request.current++
    },
    [],
  )
  useEffect(() => {
    if (kind !== 'emoji' || emojiCatalog.length) return
    let cancelled = false
    const load = async () => {
      try {
        const catalog = await import('./windowEmojiChoices')
        if (!cancelled) {
          setEmojiCatalog(catalog.WINDOW_EMOJI_CHOICES)
          setEmojiLabels(catalog.WINDOW_EMOJI_LABELS)
        }
      } catch {
        if (!cancelled)
          setError('Could not load emoji. Switch to Emoji to try again.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [kind, emojiCatalog.length])
  const hasUpload = kind === 'upload' && draft.icon !== 'upload:empty'
  const choose = (icon: string, focusSearch = false) => {
    request.current++
    setBusy(false)
    if (icon === 'favicon:auto') setSelectedFavicon('')
    if (overlay && focusSearch) search.current?.focus()
    setSearchOpen(false)
    setQuery('')
    onIntent({
      type: 'change-window-draft',
      value: { icon, iconChoices: getWindowIconChoices(icon, choices) },
    })
  }
  useLayoutEffect(() => {
    const element = region.current
    if (!element) return
    const update = () =>
      setColumns(
        Math.max(
          3,
          Math.min(8, Math.floor(((element.clientWidth || 352) + 4) / 44)),
        ),
      )
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const terms = query.toLowerCase().replaceAll('-', ' ').trim().split(/\s+/)
  const matches =
    kind === 'emoji'
      ? emojiCatalog
          .filter((emoji) =>
            terms.every((term) =>
              emoji.keywords.replaceAll('-', ' ').includes(term),
            ),
          )
          .map((emoji) => emoji.value)
      : WINDOW_ICONS.filter((icon) =>
          terms.every((term) => icon.replaceAll('-', ' ').includes(term)),
        )
  const overlay = searchOpen && Boolean(query.trim())
  const imageChoice = async (
    source: File | string,
    type: 'upload' | 'favicon',
  ) => {
    const sequence = ++request.current
    setBusy(true)
    setError('')
    try {
      const image = await windowIconImage(source)
      if (sequence !== request.current) return
      choose(`${type}:${image}`)
      if (type === 'favicon') setSelectedFavicon(source as string)
    } catch {
      if (sequence === request.current)
        setError(
          'Could not open this image. Choose a PNG, JPEG, GIF, WebP, or SVG under 5 MB.',
        )
    } finally {
      if (sequence === request.current) setBusy(false)
    }
  }
  const changeType = (value: WindowIconKind) => {
    setError('')
    setSearchOpen(false)
    const icon =
      choices[value] ??
      defaultWindowIcon(
        value,
        draft.name ||
          model.windows.find((window) => window.id === draft.windowId)?.title ||
          'Window',
      )
    choose(icon)
  }
  const gridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (overlay) {
        setSearchOpen(false)
        setQuery('')
        search.current?.focus()
      } else onIntent({ type: 'save-window' })
      return
    }
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    )
      return
    event.preventDefault()
    event.stopPropagation()
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
    ]
    const index = buttons.indexOf(target as HTMLButtonElement)
    const step =
      event.key === 'ArrowUp'
        ? -Number(event.currentTarget.dataset.columns ?? columns)
        : event.key === 'ArrowDown'
          ? Number(event.currentTarget.dataset.columns ?? columns)
          : event.key === 'ArrowLeft'
            ? -1
            : 1
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : index + step
    if (
      (next < 0 && event.key === 'ArrowUp') ||
      (next >= buttons.length && event.key === 'ArrowDown')
    ) {
      const rows = [
        ...region.current!.querySelectorAll<HTMLElement>('[data-editor-row]'),
      ]
      const row = event.currentTarget.closest<HTMLElement>('[data-editor-row]')!
      const destination = rows[rows.indexOf(row) + (next < 0 ? -1 : 1)]
      if (destination) editorRowEntry(destination)?.focus()
      else
        target
          .closest('form')
          ?.querySelector<HTMLElement>('[data-editor-done]')
          ?.focus()
    } else {
      const button = buttons[(next + buttons.length) % buttons.length]
      button?.focus()
      button?.scrollIntoView({ block: 'nearest' })
      if (!overlay && kind === 'icon') button?.click()
    }
  }
  const seen = new Set<string>()
  const faviconWindows = [...model.windows].sort(
    (a, b) => Number(b.id === draft.windowId) - Number(a.id === draft.windowId),
  )
  const favicons = faviconWindows.flatMap((window) =>
    window.tabs.flatMap((tab) => {
      if (!tab.faviconUrl || !tab.url) return []
      let hostname: string
      try {
        hostname = new URL(tab.url).hostname
      } catch {
        return []
      }
      if (!hostname || seen.has(hostname)) return []
      seen.add(hostname)
      return [
        {
          url: tab.faviconUrl,
          hostname,
          title: tab.title,
        },
      ]
    }),
  )
  return (
    <div ref={region} className="stack-y-3">
      <fieldset data-editor-row="colors">
        <legend className="mb-1 text-xs">Color</legend>
        <div className="grid grid-cols-9 gap-1">
          {TAB_GROUP_COLOR_IDS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${label(color)} icon color`}
              aria-pressed={draft.iconColor === color}
              tabIndex={
                (draft.iconColor ?? TAB_GROUP_COLOR_IDS[0]) === color ? 0 : -1
              }
              className={cn(
                control,
                'h-9 min-h-9 min-w-0',
                draft.iconColor === color && 'ring-2 ring-focus ring-inset',
              )}
              onClick={() =>
                onIntent({
                  type: 'change-window-draft',
                  value: { iconColor: color },
                })
              }
            >
              <span
                className={cn(
                  'size-5 rounded-full',
                  getGroupColorClasses(color).dot,
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div
        role="tablist"
        aria-label="Icon type"
        data-editor-row="types"
        className="
          flex gap-1 overflow-x-auto rounded-lg bg-(--manager-chrome) p-1
        "
      >
        {types.map((type) => (
          <button
            key={type.id}
            id={`${id}-${type.id}`}
            role="tab"
            type="button"
            aria-selected={kind === type.id}
            aria-controls={`${id}-panel`}
            tabIndex={kind === type.id ? 0 : -1}
            className={cn(
              control,
              'min-h-9 min-w-max flex-1 px-2 text-xs whitespace-nowrap',
              kind === type.id &&
                'bg-accent-selected font-medium text-foreground',
            )}
            onClick={() => changeType(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${kind}`}
        className="flex h-54 min-h-0 flex-col gap-2"
      >
        {(kind === 'icon' || kind === 'emoji') && (
          <div
            className="flex min-h-0 flex-1 flex-col gap-2"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setSearchOpen(false)
            }}
          >
            <label
              data-editor-row="icon-search"
              className="block shrink-0 text-sm"
            >
              <span className="sr-only">
                {kind === 'icon' ? 'Search icons' : 'Search emoji'}
              </span>
              <div className="relative">
                <Search
                  size={16}
                  className="
                    pointer-events-none absolute top-1/2 left-3 -translate-y-1/2
                    text-muted
                  "
                  aria-hidden="true"
                />
                <input
                  ref={search}
                  type="search"
                  value={query}
                  aria-controls={`${id}-results`}
                  placeholder={
                    kind === 'icon' ? 'Search icons' : 'Search emoji'
                  }
                  className={cn(field, 'mt-0 pl-9')}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      event.stopPropagation()
                      if (overlay) setSearchOpen(false)
                      else onIntent({ type: 'save-window' })
                    }
                    if (event.key === 'Enter' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      event.stopPropagation()
                      region.current
                        ?.querySelector<HTMLElement>(
                          '[data-editor-row="icons"] button[aria-pressed="true"], [data-editor-row="icons"] button[tabindex="0"]',
                        )
                        ?.focus()
                    }
                  }}
                  data-editor-native
                />
              </div>
            </label>
            <div id={`${id}-results`} className="relative min-h-0 flex-1">
              <WindowIconGrid
                kind={kind}
                titles={emojiLabels}
                choices={(kind === 'icon'
                  ? SUGGESTED_WINDOW_ICONS
                  : suggestedEmojis
                ).slice(0, columns * 4)}
                hidden={overlay}
                columns={columns}
                selected={draft.icon}
                color={draft.iconColor}
                onChoose={(icon) => choose(icon, true)}
                onKeyDown={gridKey}
              />
              {overlay && (
                <WindowIconGrid
                  kind={kind}
                  titles={emojiLabels}
                  loading={kind === 'emoji' && !emojiCatalog.length}
                  choices={matches}
                  results
                  columns={columns}
                  selected={draft.icon}
                  color={draft.iconColor}
                  onChoose={(icon) => choose(icon, true)}
                  onKeyDown={gridKey}
                />
              )}
            </div>
          </div>
        )}
        {kind === 'monogram' && (
          <WindowMonogramInput icon={draft.icon!} onChoose={choose} />
        )}
        {kind === 'upload' && (
          <div data-editor-row="upload" className="min-h-0 flex-1">
            <input
              ref={upload}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload window image"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void imageChoice(file, 'upload')
                event.target.value = ''
              }}
            />
            <button
              data-editor-native
              type="button"
              disabled={busy}
              onClick={() => upload.current?.click()}
              className={cn(
                control,
                `
                  flex size-full flex-col gap-2 border border-dashed
                  border-border p-4 text-sm
                `,
              )}
            >
              {hasUpload ? (
                <WindowIcon icon={draft.icon} size={48} />
              ) : (
                <ImagePlus size={32} strokeWidth={1.5} />
              )}
              {busy
                ? 'Preparing image…'
                : hasUpload
                  ? 'Choose another image'
                  : 'Choose an image'}
              <span className="text-xs text-muted">
                PNG, JPEG, GIF, WebP, or SVG · up to 5 MB
              </span>
            </button>
          </div>
        )}
        {kind === 'favicon' && (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div
              data-editor-row={favicons.length ? 'favicons' : undefined}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div
                data-icon-grid
                data-columns={columns}
                role="toolbar"
                aria-label="Favicons"
                onKeyDown={gridKey}
                className={gridClass}
                style={{
                  gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
                }}
              >
                {favicons.map((favicon, index) => (
                  <button
                    key={favicon.hostname}
                    data-editor-native
                    type="button"
                    disabled={busy}
                    tabIndex={
                      (
                        favicons.some(
                          (choice) => choice.url === selectedFavicon,
                        )
                          ? selectedFavicon === favicon.url
                          : index === 0
                      )
                        ? 0
                        : -1
                    }
                    aria-label={`Use ${favicon.hostname} favicon`}
                    title={`${favicon.title} · ${favicon.hostname}`}
                    aria-pressed={selectedFavicon === favicon.url}
                    className={cn(
                      choiceClass,
                      selectedFavicon === favicon.url &&
                        'bg-accent-selected ring-2 ring-focus ring-inset',
                    )}
                    onClick={() => void imageChoice(favicon.url, 'favicon')}
                  >
                    <WindowIcon iconUrl={favicon.url} />
                  </button>
                ))}
              </div>
            </div>
            {!favicons.length && (
              <p className="text-sm text-muted">
                Open a website to choose its favicon.
              </p>
            )}
            {busy && (
              <p role="status" className="text-xs text-muted">
                Preparing favicon…
              </p>
            )}
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="max-h-14 shrink-0 overflow-y-auto text-xs text-muted"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
