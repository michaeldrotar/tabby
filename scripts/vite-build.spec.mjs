import { once } from 'node:events'
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
import { build } from 'vite'
import { expect, it } from 'vitest'
const { WebSocket } = createRequire(
  new URL('../packages/hmr/package.json', import.meta.url),
)('ws')

const jiti = createJiti(import.meta.url)
const { withPageConfig } = await jiti.import(
  '../packages/vite-config/lib/with-page-config.ts',
)
const { watchPublicPlugin } = await jiti.import(
  '../packages/hmr/lib/plugins/watch-public-plugin.ts',
)
const { watchRebuildPlugin } = await jiti.import(
  '../packages/hmr/dist/lib/plugins/watch-rebuild-plugin.js',
)
const { startReloadServer } = await jiti.import(
  '../packages/hmr/lib/initializers/reload-server.ts',
)

it('builds local page assets, environment values and source maps for Chrome 127', async () => {
  const root = await mkdtemp(resolve('node_modules/.vite-build-'))
  try {
    await writeFile(
      resolve(root, 'index.html'),
      '<script type="module" src="/main.ts"></script>',
    )
    await writeFile(
      resolve(root, 'main.ts'),
      'import asset from "./image.svg?no-inline"; document.body.textContent = process.env.PAGE_VALUE; document.body.dataset.asset = asset',
    )
    await writeFile(
      resolve(root, 'image.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
    )
    const result = await build(
      withPageConfig({
        configFile: false,
        root,
        logLevel: 'silent',
        define: { 'process.env': { PAGE_VALUE: 'build-value' } },
        build: { write: false, sourcemap: true },
      }),
    )
    const output = result.output
    const js = output.find((item) => item.type === 'chunk')
    expect(js.code).toContain('build-value')
    expect(js.code).not.toMatch(/process\.env|eval\(|https?:\/\//)
    const asset = output.find(
      (item) => item.type === 'asset' && item.fileName.endsWith('.svg'),
    )
    expect(asset).toBeDefined()
    expect(js.code).toContain(basename(asset.fileName))
    expect(
      output.find((item) => item.fileName.endsWith('.js.map')),
    ).toBeDefined()
    expect(
      output.find((item) => item.fileName === 'index.html').source,
    ).toContain(js.fileName)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

it('rebuilds source, public and locale files, broadcasts reloads and closes the watcher', async () => {
  const root = await mkdtemp(resolve('node_modules/.vite-watch-'))
  const server = await startReloadServer(0)
  let watcher, client
  try {
    const pluginPath = resolve(
      root,
      'packages/hmr/dist/lib/plugins/watch-i18n-plugin.mjs',
    )
    const messagesPath = resolve(root, 'packages/i18n/locales/en/messages.json')
    await mkdir(resolve(pluginPath, '..'), { recursive: true })
    await mkdir(resolve(messagesPath, '..'), { recursive: true })
    await copyFile(
      resolve('packages/hmr/dist/lib/plugins/watch-i18n-plugin.js'),
      pluginPath,
    )
    await writeFile(messagesPath, '{}')
    const { watchI18nPlugin } = await import(pathToFileURL(pluginPath).href)
    await mkdir(resolve(root, 'public'))
    await writeFile(resolve(root, 'public/value.txt'), 'first-public')
    await writeFile(resolve(root, 'main.ts'), 'console.log("first-source")')
    client = new WebSocket(`ws://127.0.0.1:${server.port}`)
    await once(client, 'open')
    const previousDev = process.env.CLI_CEB_DEV
    let watch
    try {
      process.env.CLI_CEB_DEV = 'true'
      ;({ watchOption: watch } = await createJiti(import.meta.url, {
        moduleCache: false,
        fsCache: false,
      }).import('../packages/vite-config/lib/with-page-config.ts'))
    } finally {
      if (previousDev === undefined) delete process.env.CLI_CEB_DEV
      else process.env.CLI_CEB_DEV = previousDev
    }
    expect(watch.watcher.useDebounce).toBe(true)
    watcher = await build({
      configFile: false,
      root,
      logLevel: 'silent',
      plugins: [
        watchPublicPlugin(),
        watchI18nPlugin(),
        watchRebuildPlugin({
          id: 'watch-test',
          socketUrl: `ws://127.0.0.1:${server.port}`,
        }),
      ],
      build: {
        target: 'chrome127',
        minify: false,
        lib: {
          entry: resolve(root, 'main.ts'),
          formats: ['es'],
          fileName: 'background',
        },
        watch,
      },
    })
    const nextBuild = () =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          watcher.off('event', listener)
          reject(Error('Watch rebuild timed out'))
        }, 10000)
        const listener = (event) => {
          if (event.code === 'ERROR') {
            clearTimeout(timeout)
            watcher.off('event', listener)
            reject(event.error)
          } else if (event.code === 'END') {
            clearTimeout(timeout)
            watcher.off('event', listener)
            resolve()
          }
        }
        watcher.on('event', listener)
      })
    await nextBuild()
    expect(await readFile(resolve(root, 'dist/value.txt'), 'utf8')).toBe(
      'first-public',
    )
    let rebuilt = nextBuild()
    await writeFile(resolve(root, 'public/value.txt'), 'second-public')
    await rebuilt
    expect(await readFile(resolve(root, 'dist/value.txt'), 'utf8')).toBe(
      'second-public',
    )
    rebuilt = nextBuild()
    await writeFile(resolve(root, 'public/added.txt'), 'added-public')
    await rebuilt
    expect(await readFile(resolve(root, 'dist/added.txt'), 'utf8')).toBe(
      'added-public',
    )
    rebuilt = nextBuild()
    await writeFile(
      messagesPath,
      '{"extensionName":{"message":"Updated locale"}}',
    )
    await rebuilt
    const message = once(client, 'message')
    rebuilt = nextBuild()
    await writeFile(resolve(root, 'main.ts'), 'console.log("second-source")')
    await rebuilt
    expect(
      await readFile(resolve(root, 'dist/background.js'), 'utf8'),
    ).toContain('second-source')
    expect(String((await message)[0])).toContain('watch-test')
    await watcher.close()
    watcher = undefined
  } finally {
    await watcher?.close()
    client?.terminate()
    await server.close()
    await rm(root, { recursive: true, force: true })
  }
}, 30000)
