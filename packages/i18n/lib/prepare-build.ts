import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getEnv } from '@extension/env'
import setRelatedLocaleImports from './set-related-locale-import.js'

const ENV = getEnv()

const runPrepareBuild = () => {
  const i18nPath = ENV['IS_DEV'] ? 'lib/i18n-dev.ts' : 'lib/i18n-prod.ts'
  cpSync(i18nPath, resolve('lib', 'i18n.ts'))

  const outDir = resolve(
    import.meta.dirname,
    '..',
    '..',
    '..',
    '..',
    ENV['BUILD_OUT_DIR'],
  )
  if (!existsSync(outDir)) {
    mkdirSync(outDir)
  }

  const localePath = resolve(outDir, '_locales')
  cpSync(resolve('locales'), localePath, { recursive: true })

  if (ENV['IS_DEV']) {
    setRelatedLocaleImports()
  }
  console.log('I18n build complete')
}

runPrepareBuild()
