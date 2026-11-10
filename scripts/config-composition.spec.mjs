import { resolve } from 'node:path'
import { createJiti } from 'jiti'
import resolveConfig from 'tailwindcss/resolveConfig.js'
import { describe, expect, it } from 'vitest'

const jiti = createJiti(import.meta.url)
const { createTailwindConfig } = await jiti.import(
  '../packages/ui/lib/create-tailwind-config.ts',
)
const { uiTailwindConfig } = await jiti.import(
  '../packages/ui/lib/ui-tailwind-config.ts',
)
const { withPageConfig } = await jiti.import(
  '../packages/vite-config/lib/with-page-config.ts',
)

describe('configuration composition', () => {
  it('resolves shared Tailwind presets, content, theme overrides and functions', () => {
    const color = () => '#123456'
    const input = {
      content: ['src/**/*.tsx'],
      presets: [{ theme: { extend: { spacing: { 128: '32rem' } } } }],
      theme: { extend: { colors: { custom: color, accent: '#abcdef' } } },
    }
    const output = resolveConfig(createTailwindConfig(uiTailwindConfig, input))
    expect(output.content.files).toEqual([
      '../../packages/ui/lib/**/*.{ts,tsx}',
      'src/**/*.tsx',
    ])
    expect(output.theme.spacing[128]).toBe('32rem')
    expect(output.theme.colors.custom).toBe(color)
    expect(output.theme.colors.accent).toBe('#abcdef')
    expect(output.theme.colors.background).toBe(
      'hsl(from var(--background) h s l / <alpha-value>)',
    )
    expect(output.darkMode).toBe('media')
    expect(
      resolveConfig(createTailwindConfig(uiTailwindConfig, { content: [] }))
        .darkMode[0],
    ).toBe('variant')
    output.content.files.push('extra.tsx')
    output.theme.colors.accent = '#000000'
    expect(input.content).toEqual(['src/**/*.tsx'])
    expect(input.theme.extend.colors.accent).toBe('#abcdef')
    expect(
      resolveConfig(createTailwindConfig(uiTailwindConfig, input)).content
        .files,
    ).toHaveLength(2)
  })

  it('preserves page aliases, environment defaults, plugins and build overrides', () => {
    const transform = () => null
    const input = {
      base: '/page/',
      plugins: [{ name: 'page', transform }],
      define: { 'process.env': { PAGE_VALUE: 'value' } },
      resolve: { alias: { '@src': resolve('pages/options/src') } },
      build: {
        outDir: '/dist/page',
        rolldownOptions: { external: ['custom'] },
      },
    }
    const output = withPageConfig(input)
    expect(output.base).toBe('/page/')
    expect(output.resolve.alias).toEqual(input.resolve.alias)
    expect(output.define['process.env']).toMatchObject({ PAGE_VALUE: 'value' })
    expect(Object.keys(output.define['process.env']).length).toBeGreaterThan(1)
    expect(
      output.plugins
        .flat()
        .filter(Boolean)
        .map((plugin) => plugin.name),
    ).toContain('vite:react-swc')
    expect(output.plugins.at(-1).transform).toBe(transform)
    expect(output.build).toMatchObject({
      outDir: '/dist/page',
      target: 'chrome127',
      rolldownOptions: { external: ['chrome', 'custom'] },
    })
    expect(typeof output.build.sourcemap).toBe('boolean')
    output.build.rolldownOptions.external.push('extra')
    expect(input.build.rolldownOptions.external).toEqual(['custom'])
    expect(withPageConfig({}).base).toBe('')
  })
})
