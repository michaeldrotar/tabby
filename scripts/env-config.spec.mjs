import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, expect, it } from 'vitest'

const fixtures = []
afterEach(async () => {
  await Promise.all(
    fixtures.splice(0).map((path) => rm(path, { recursive: true })),
  )
})

const load = async (contents, variables = {}) => {
  await mkdir('packages/env/.turbo', { recursive: true })
  const root = await mkdtemp(resolve('packages/env/.turbo/env-test-'))
  fixtures.push(root)
  const directory = resolve(root, 'a/b/c/d')
  await mkdir(directory, { recursive: true })
  await copyFile('packages/env/lib/config.ts', resolve(directory, 'config.ts'))
  if (contents !== undefined) await writeFile(resolve(root, '.env'), contents)
  const output = execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--input-type=module',
      '-e',
      `const { baseEnv, env } = await import(${JSON.stringify(resolve(directory, 'config.ts'))}); console.log(JSON.stringify({ baseEnv, env, value: process.env.CEB_TEST_VALUE }))`,
    ],
    {
      env: {
        PATH: process.env.PATH,
        DOTENV_CONFIG_QUIET: 'true',
        ...variables,
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  return JSON.parse(output.trim().split('\n').at(-1))
}

it('loads file values synchronously and derives development mode', async () => {
  const result = await load('CEB_TEST_VALUE=fixture\nCEB_DEV=true\n')
  expect(result.baseEnv).toEqual({ CEB_TEST_VALUE: 'fixture', CEB_DEV: 'true' })
  expect(result.env.CEB_NODE_ENV).toBe('development')
  expect(result.value).toBe('fixture')
})

it('preserves existing process values including the mode input', async () => {
  const result = await load('CEB_TEST_VALUE=fixture\nCEB_DEV=true\n', {
    CEB_TEST_VALUE: 'existing',
    CEB_DEV: 'false',
  })
  expect(result.baseEnv).toEqual({
    CEB_TEST_VALUE: 'existing',
    CEB_DEV: 'false',
  })
  expect(result.value).toBe('existing')
  expect(result.env.CEB_NODE_ENV).toBe('production')
})

it('defaults to production when the file is missing', async () => {
  expect(await load()).toEqual({
    baseEnv: {},
    env: { CEB_NODE_ENV: 'production' },
  })
})
