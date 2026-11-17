export const INCOGNITO_ICON_OPTIONS = [
  { id: 'ninja', name: 'Ninja' },
  { id: 'spy', name: 'Spy' },
  { id: 'ghost', name: 'Ghost' },
  { id: 'classic', name: 'Classic Tabby' },
] as const

export type IncognitoIconChoice = (typeof INCOGNITO_ICON_OPTIONS)[number]['id']

export const isIncognitoIconChoice = (
  value: unknown,
): value is IncognitoIconChoice =>
  INCOGNITO_ICON_OPTIONS.some((option) => option.id === value)

export const getIncognitoIconPath = (
  choice: IncognitoIconChoice,
  size = 128,
): string =>
  choice === 'classic'
    ? `tabby-face-${size}.png`
    : `incognito-icons/${choice}-${size}.png`
