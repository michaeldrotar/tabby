import { resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { zipBundle } from './lib/index.js'
import { IS_FIREFOX } from '@extension/env'

const packageJsonPath = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'package.json',
)
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const version = packageJson.version
const fileName = `tabby-${version}`
const archiveName = IS_FIREFOX ? `${fileName}.xpi` : `${fileName}.zip`
const buildDirectory = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'dist-zip',
)
const archivePath = resolve(buildDirectory, archiveName)

if (existsSync(archivePath)) {
  console.error(
    `Error: Archive ${archiveName} already exists in ${buildDirectory}`,
  )
  process.exit(1)
}

await zipBundle({
  distDirectory: resolve(import.meta.dirname, '..', '..', '..', 'dist'),
  buildDirectory,
  archiveName,
})
