import { resolve } from 'node:path'
import { createJiti } from 'jiti'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import { build } from 'vite'
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
  it('compiles shared presets, sources, theme functions and overrides', async () => {
    const directory = await mkdtemp(resolve('.turbo/tailwind-test-'))
    try {
      await writeFile(
        resolve(directory, 'fixture.html'),
        '<div class="p-128 bg-custom bg-custom/50 bg-accent bg-background/80 dark:bg-custom"></div>',
      )
      await writeFile(
        resolve(directory, 'config.ts'),
        `
        import { createTailwindConfig } from '../../packages/ui/lib/create-tailwind-config.ts'
        import { uiTailwindConfig } from '../../packages/ui/lib/ui-tailwind-config.ts'
        export default createTailwindConfig(uiTailwindConfig, {
          content: ['./fixture.html'],
          presets: [{ theme: { extend: { spacing: { 128: '32rem' }, colors: { fixture: '#123456' } } } }],
          theme: { extend: { colors: { accent: '#abcdef' }, backgroundColor: ({ theme }) => ({ custom: theme('colors.fixture') }) } },
        })
      `,
      )
      await writeFile(
        resolve(directory, 'index.css'),
        `
        @import "${resolve('packages/ui/base.css')}";
        @config "./config.ts";

      `,
      )
      const output = await build({
        configFile: false,
        root: directory,
        logLevel: 'silent',
        plugins: [tailwindcss()],
        build: {
          write: false,
          cssMinify: false,
          rolldownOptions: { input: resolve(directory, 'index.css') },
        },
      })
      const css = output.output.find((item) =>
        item.fileName.endsWith('.css'),
      ).source
      expect(css).toMatch(/\.p-128\s*\{\s*padding: 32rem;/)
      expect(css).toMatch(/\.bg-custom\s*\{\s*background-color: #123456;/)
      expect(css).toContain('.bg-custom\\/50')
      expect(css).toContain('.bg-background\\/80')
      expect(css).toContain('50%')
      const input = {
        content: ['fixture.html'],
        theme: { extend: { colors: { custom: '#123456' } } },
      }
      const composed = createTailwindConfig(uiTailwindConfig, input)
      composed.content.push('extra.tsx')
      expect(input.content).toEqual(['fixture.html'])
      expect(
        createTailwindConfig(uiTailwindConfig, input).content,
      ).toHaveLength(2)
      expect(css).toContain('#abcdef')
      expect(css).toContain('var(--background)')
      expect(css).toContain('data-theme="dark"')
      expect(css).toContain('prefers-color-scheme: dark')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
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
