import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { ESLint } from 'eslint'
import importX from 'eslint-plugin-import-x'
import { rimraf, rimrafSync } from 'rimraf'
import { parser } from 'typescript-eslint'
import { afterEach, describe, expect, it } from 'vitest'

const commonJSPlugin = createRequire(import.meta.url)('eslint-plugin-import-x')
const fixtures = []
const fixture = async () => {
  const directory = await mkdtemp(resolve('node_modules/.tooling-test-'))
  fixtures.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    fixtures.splice(0).map((path) => rm(path, { recursive: true })),
  )
})

describe('tooling compatibility', () => {
  it('discovers configured files and invalidates cached lint results', async () => {
    const cwd = await fixture()
    await mkdir(resolve(cwd, 'src/ignored'), { recursive: true })
    await mkdir(resolve(cwd, 'test'))
    await writeFile(resolve(cwd, 'src/app.js'), 'var value = 1\n')
    await writeFile(resolve(cwd, 'test/app.mjs'), 'var value = 2\n')
    await writeFile(resolve(cwd, 'src/ignored/skip.js'), 'var value = 3\n')
    const options = {
      cwd,
      overrideConfigFile: true,
      overrideConfig: [
        { ignores: ['**/ignored/**'] },
        {
          files: ['{src,test}/**/*.{js,mjs}'],
          rules: { 'no-var': 'error' },
        },
      ],
      cache: true,
      cacheLocation: resolve(cwd, '.eslintcache'),
    }
    const lint = () =>
      new ESLint(options).lintFiles(['{src,test}/**/*.{js,mjs}'])
    const cold = await lint()
    expect(cold.map((result) => result.filePath).sort()).toEqual(
      [resolve(cwd, 'src/app.js'), resolve(cwd, 'test/app.mjs')].sort(),
    )
    expect(
      cold.map((result) => result.messages.map((message) => message.ruleId)),
    ).toEqual([['no-var'], ['no-var']])
    expect(await lint()).toEqual(cold)
    await writeFile(resolve(cwd, 'src/app.js'), 'const value = 123\n')
    const updated = await lint()
    expect(
      updated.find((result) => result.filePath.endsWith('/src/app.js'))
        .errorCount,
    ).toBe(0)
    expect(
      updated.find((result) => result.filePath.endsWith('/test/app.mjs'))
        .errorCount,
    ).toBe(1)
  })

  it.each([
    {
      name: 'allow patterns',
      options: { allow: ['allowed/**'] },
      paths: ['./allowed/internal.js', './blocked/internal.js'],
      rejected: ['./blocked/internal.js'],
    },
    {
      name: 'forbidden directory boundaries',
      options: { forbid: ['blocked/**'] },
      paths: [
        './allowed/internal.js',
        './blocked',
        './blocked/nested/entry.js',
      ],
      rejected: ['./blocked', './blocked/nested/entry.js'],
    },
    {
      name: 'negated forbidden patterns',
      options: { forbid: ['!blocked/**'] },
      paths: ['./allowed/internal.js', './blocked/internal.js'],
      rejected: ['./allowed/internal.js', './blocked/internal.js'],
    },
    {
      name: 'brace patterns',
      options: { allow: ['{allowed,blocked}/internal.js'] },
      paths: [
        './allowed/internal.js',
        './blocked/internal.js',
        './blocked/nested/entry.js',
      ],
      rejected: ['./blocked/nested/entry.js'],
    },
  ])(
    'preserves $name through both plugin entry points',
    async ({ options, paths, rejected }) => {
      const cwd = await fixture()
      await mkdir(resolve(cwd, 'allowed'))
      await mkdir(resolve(cwd, 'blocked/nested'), { recursive: true })
      for (const file of [
        'allowed/internal.js',
        'blocked/internal.js',
        'blocked/index.js',
        'blocked/nested/entry.js',
      ]) {
        await writeFile(resolve(cwd, file), 'export {}')
      }
      for (const plugin of [importX, commonJSPlugin]) {
        const eslint = new ESLint({
          cwd,
          overrideConfigFile: true,
          overrideConfig: {
            plugins: { 'import-x': plugin },
            rules: { 'import-x/no-internal-modules': ['error', options] },
          },
        })
        const [result] = await eslint.lintText(
          paths.map((path) => `import '${path}'`).join(';'),
          { filePath: resolve(cwd, 'example.js') },
        )
        expect(
          result.messages.map(({ ruleId, message }) => ({ ruleId, message })),
        ).toEqual(
          rejected.map((path) => ({
            ruleId: 'import-x/no-internal-modules',
            message: `Reaching to "${path}" is not allowed.`,
          })),
        )
      }
    },
  )

  it('matches TypeScript project service fallback files', async () => {
    const cwd = await fixture()
    await writeFile(
      resolve(cwd, 'tsconfig.json'),
      JSON.stringify({ files: ['included.ts'] }),
    )
    await writeFile(resolve(cwd, 'included.ts'), 'export {}')
    const options = {
      filePath: resolve(cwd, 'fallback.ts'),
      tsconfigRootDir: cwd,
      projectService: { allowDefaultProject: ['*.ts'] },
    }
    expect(
      parser.parseForESLint('const value: number = 1', options).services
        .program,
    ).toBeTruthy()
    expect(() =>
      parser.parseForESLint('const value = 1', {
        ...options,
        filePath: resolve(cwd, 'unmatched.js'),
      }),
    ).toThrow(/not.*allowDefaultProject/)
  })

  it('cleans matching files through asynchronous and synchronous glob APIs', async () => {
    const cwd = await fixture()
    await writeFile(resolve(cwd, 'async.tmp'), '')
    await writeFile(resolve(cwd, 'sync.tmp'), '')
    await writeFile(resolve(cwd, 'keep.txt'), 'keep')
    await rimraf('async.*', { glob: { cwd } })
    rimrafSync('sync.*', { glob: { cwd } })
    await expect(readFile(resolve(cwd, 'async.tmp'))).rejects.toThrow(/ENOENT/)
    await expect(readFile(resolve(cwd, 'sync.tmp'))).rejects.toThrow(/ENOENT/)
    expect(await readFile(resolve(cwd, 'keep.txt'), 'utf8')).toBe('keep')
  })
})
