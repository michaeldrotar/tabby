import { describe, expect, it } from 'vitest'
import {
  deserializeWindowIdentity,
  migrateWindowIdentity,
  serializeWindowIdentity,
} from './windowIdentityStorage.js'
import type { WindowIconChoices, WindowIconKind } from './windowIconChoice.js'

const png = 'data:image/png;base64,YQ=='
const choices: WindowIconChoices = {
  icon: 'book',
  emoji: 'emoji:🔬',
  monogram: 'monogram:RN',
  upload: `upload:${png}`,
  favicon: `favicon:${png}`,
}
const record = {
  key: 'saved-window',
  name: 'Research notebook',
  icon: 'book',
  iconColor: 'green' as const,
  hashes: ['hash-a', 'hash-b'],
  position: 2,
  updatedAt: 1794614400000,
}

describe('window settings storage', () => {
  it('migrates published records without changing identity or matching metadata', () => {
    const migrated = migrateWindowIdentity(record, () => 0)
    expect(migrated).toEqual({
      ...record,
      version: 2,
      useCustom: true,
      icon: 'icon',
      iconChoices: { icon: 'book', emoji: '😀', monogram: 'RN' },
    })
    expect(
      migrateWindowIdentity(migrated, () => {
        throw new Error('Already migrated')
      }),
    ).toEqual(migrated)
  })

  it('fills missing legacy settings once and keeps intentional empty names', () => {
    const migrated = migrateWindowIdentity({ key: 'incomplete' }, () => 0.5)
    expect(migrated).toMatchObject({
      version: 2,
      name: 'Window 5500',
      iconColor: 'green',
      icon: 'icon',
      iconChoices: { icon: 'music', emoji: '❤️', monogram: 'W5' },
    })
    expect(migrateWindowIdentity({ ...record, name: '' }, () => 0).name).toBe(
      '',
    )
  })

  it('preserves every prefixed development choice and Reset state', () => {
    expect(
      migrateWindowIdentity(
        { ...record, icon: 'emoji:🔬', iconChoices: choices, useCustom: false },
        () => 0,
      ),
    ).toMatchObject({
      version: 2,
      useCustom: false,
      icon: 'emoji',
      iconChoices: {
        icon: 'book',
        emoji: '🔬',
        monogram: 'RN',
        upload: png,
        favicon: png,
      },
    })
  })

  it('uses the version marker to distinguish an Upload library icon from an uploaded image', () => {
    const legacy = migrateWindowIdentity({ ...record, icon: 'upload' }, () => 0)
    expect(legacy).toMatchObject({
      version: 2,
      icon: 'icon',
      iconChoices: { icon: 'upload' },
    })
    expect(deserializeWindowIdentity(legacy).icon).toBe('upload')
    expect(
      deserializeWindowIdentity({
        version: 2,
        icon: 'upload',
        iconChoices: { upload: png },
      }).icon,
    ).toBe(`upload:${png}`)
  })

  it.each(Object.keys(choices) as WindowIconKind[])(
    'round-trips %s without duplicating its selected value',
    (kind) => {
      const internal = {
        ...record,
        icon: choices[kind],
        iconChoices: choices,
        useCustom: false,
      }
      const stored = serializeWindowIdentity(internal)
      expect(stored.icon).toBe(kind)
      expect(stored.iconChoices).toEqual({
        icon: 'book',
        emoji: '🔬',
        monogram: 'RN',
        upload: png,
        favicon: png,
      })
      expect(deserializeWindowIdentity(stored)).toEqual({
        name: record.name,
        icon: choices[kind],
        iconChoices: choices,
        iconColor: 'green',
        useCustom: false,
      })
    },
  )

  it.each(['upload:empty', 'favicon:auto'])(
    'keeps %s usable without storing a placeholder as image data',
    (icon) => {
      const stored = serializeWindowIdentity({ ...record, icon }, () => 0)
      const kind = icon.startsWith('upload') ? 'upload' : 'favicon'
      expect(stored.iconChoices[kind]).toBeUndefined()
      expect(deserializeWindowIdentity(stored).icon).toBe(icon)
    },
  )

  it('rejects unsupported versions instead of treating them as legacy', () => {
    expect(() => migrateWindowIdentity({ ...record, version: 3 })).toThrow(
      'not supported',
    )
    expect(() => deserializeWindowIdentity({ ...record, version: 3 })).toThrow(
      'not supported',
    )
  })
})
