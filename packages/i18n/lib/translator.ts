import type { I18nValueType } from './types.js'

export const createTranslator = (
  catalog: Readonly<Record<string, I18nValueType>>,
  locale = 'en',
) => {
  const translate = (
    key: string,
    substitutions?: string | readonly string[],
  ) => {
    const entry = catalog[key]
    if (!entry) return ''
    const values =
      typeof substitutions === 'string'
        ? [substitutions]
        : (substitutions ?? [])
    const substitute = (message: string) =>
      message.replace(/\$\$|\$(\d+)/g, (match, index: string | undefined) =>
        index === undefined ? '$' : (values[Number(index) - 1] ?? ''),
      )
    return entry.message.replace(
      /\$\$|\$(\d+)|\$([a-z][a-z\d_]*)\$/gi,
      (match, index: string | undefined, name: string | undefined) => {
        if (match === '$$') return '$'
        if (index) return values[Number(index) - 1] ?? ''
        const content = Object.entries(entry.placeholders ?? {}).find(
          ([key]) => key.toLowerCase() === name?.toLowerCase(),
        )?.[1].content
        return content === undefined ? match : substitute(content)
      },
    )
  }
  const rules = new Intl.PluralRules(locale)
  return {
    t: translate,
    tt: (key: string, count: number) =>
      translate(`${key}_${rules.select(count)}`, String(count)) ||
      translate(`${key}_other`, String(count)) ||
      translate(key, String(count)),
  }
}
