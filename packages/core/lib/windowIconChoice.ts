import { WINDOW_ICON_COMPONENTS } from './windowIcons.js'

export type WindowIconKind =
  'icon' | 'emoji' | 'monogram' | 'upload' | 'favicon'
export const getWindowIconKind = (icon?: string): WindowIconKind => {
  if (icon?.startsWith('emoji:')) return 'emoji'
  if (icon?.startsWith('monogram:')) return 'monogram'
  if (icon?.startsWith('upload:')) return 'upload'
  if (icon?.startsWith('favicon:')) return 'favicon'
  return icon ? 'icon' : 'favicon'
}
export const getWindowIconValue = (icon: string) =>
  getWindowIconKind(icon) === 'icon' ? icon : icon.slice(icon.indexOf(':') + 1)
export const isWindowIcon = (icon: unknown): icon is string => {
  if (typeof icon !== 'string' || icon.length > 32768) return false
  if (
    icon === 'favicon:auto' ||
    icon === 'upload:empty' ||
    Object.hasOwn(WINDOW_ICON_COMPONENTS, icon)
  )
    return true
  const kind = getWindowIconKind(icon)
  const value = getWindowIconValue(icon)
  if (kind === 'monogram') return /^[\p{L}\p{N}]{0,3}$/u.test(value)
  if (kind === 'emoji')
    return (
      /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value) &&
      [...new Intl.Segmenter().segment(value)].length === 1
    )
  return (
    (kind === 'upload' || kind === 'favicon') &&
    /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
}

export const SUGGESTED_WINDOW_ICONS = [
  'window',
  'globe',
  'house',
  'briefcase',
  'code',
  'book',
  'folder',
  'graduation-cap',
  'flask',
  'palette',
  'pencil',
  'lightbulb',
  'camera',
  'chart-no-axes-combined',
  'calculator',
  'calendar',
  'music',
  'gamepad-2',
  'coffee',
  'utensils',
  'shopping-bag',
  'dumbbell',
  'heart',
  'gift',
  'plane',
  'map',
  'mountain',
  'tent',
  'bike',
  'leaf',
  'sun',
  'star',
] as const

export type WindowIconChoices = Partial<Record<WindowIconKind, string>>

export const getWindowIconChoices = (
  icon?: string,
  choices?: unknown,
): WindowIconChoices => {
  const result: WindowIconChoices = {}
  if (choices && typeof choices === 'object')
    for (const kind of [
      'icon',
      'emoji',
      'monogram',
      'upload',
      'favicon',
    ] as const) {
      const value = (choices as WindowIconChoices)[kind]
      if (isWindowIcon(value) && getWindowIconKind(value) === kind)
        result[kind] = value
    }
  if (isWindowIcon(icon)) result[getWindowIconKind(icon)] = icon
  return result
}

export const defaultWindowIcon = (kind: WindowIconKind, title: string) => {
  if (kind === 'icon') return 'window'
  if (kind === 'emoji') return 'emoji:😀'
  if (kind === 'upload') return 'upload:empty'
  if (kind === 'favicon') return 'favicon:auto'
  const initials = title
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => [...word][0])
    .join('')
    .toUpperCase()
  return `monogram:${[...initials].slice(0, 3).join('') || 'W'}`
}
