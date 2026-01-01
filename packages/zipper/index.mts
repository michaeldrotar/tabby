import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { IS_FIREFOX } from '@extension/env/const'
import { zipBundle } from './lib/zip-bundle.js'

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
const argv = process.argv.slice(2)
let force = false
let providedName = null
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '-f' || a === '--force') {
    force = true
  } else if (a === '-n' || a === '--name') {
    providedName = argv[i + 1]
    i++
  } else if (a && !a.startsWith('-')) {
    providedName = a
  }
}

let finalArchiveName = archiveName
if (providedName) {
  // If providedName has no extension, append .zip or .xpi based on target
  if (!/\.(zip|xpi)$/i.test(providedName)) {
    finalArchiveName = IS_FIREFOX
      ? `${providedName}.xpi`
      : `${providedName}.zip`
  } else {
    finalArchiveName = providedName
  }
}

const finalArchivePath = resolve(buildDirectory, finalArchiveName)
if (existsSync(finalArchivePath)) {
  if (force) {
    try {
      // remove existing file
      import('node:fs').then(({ unlinkSync }) => unlinkSync(finalArchivePath))
    } catch (e) {
      console.error(
        `Error removing existing archive ${finalArchiveName}: ${String(e)}`,
      )
      process.exit(1)
    }
  } else {
    console.error(
      `Error: Archive ${finalArchiveName} already exists in ${buildDirectory}`,
    )
    process.exit(1)
  }
}

await zipBundle({
  distDirectory: resolve(import.meta.dirname, '..', '..', '..', 'dist'),
  buildDirectory,
  archiveName: finalArchiveName,
})
