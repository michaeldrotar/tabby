/** Preserve selection sets when storing a versioned scene checkpoint as JSON. */
export const serializeDemoState = (state: unknown): string =>
  JSON.stringify(state, (_key, value: unknown) =>
    value instanceof Set ? { $tabbySet: [...value] } : value,
  )

export const deserializeDemoState = <State>(json: string): State =>
  JSON.parse(json, (_key, value: unknown) => {
    if (
      value &&
      typeof value === 'object' &&
      Object.keys(value).length === 1 &&
      '$tabbySet' in value &&
      Array.isArray(value.$tabbySet)
    )
      return new Set(value.$tabbySet)
    return value
  }) as State
