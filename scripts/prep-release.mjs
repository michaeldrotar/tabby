#!/usr/bin/env node

/**
 * Prepares a release by updating the version in the root package.json
 * and creating a release notes template if needed.
 *
 * Usage:
 *   pnpm prep patch   - Bump patch version (1.0.0 -> 1.0.1)
 *   pnpm prep minor   - Bump minor version (1.0.0 -> 1.1.0)
 *   pnpm prep major   - Bump major version (1.0.0 -> 2.0.0)
 *   pnpm prep 2.0.0   - Set specific version
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dedent from 'dedent'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const packageJsonPath = resolve(rootDir, 'package.json')

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!match) {
    throw new Error(`Invalid version format: ${version}`)
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  }
}

function bumpVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Unknown bump type: ${type}`)
  }
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: pnpm prep {patch|minor|major|<version>}')
    console.error('')
    console.error('Examples:')
    console.error('  pnpm prep patch   - Bump patch version (1.0.0 -> 1.0.1)')
    console.error('  pnpm prep minor   - Bump minor version (1.0.0 -> 1.1.0)')
    console.error('  pnpm prep major   - Bump major version (1.0.0 -> 2.0.0)')
    console.error('  pnpm prep 2.0.0   - Set specific version')
    process.exit(1)
  }

  const input = args[0]

  // Read package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const currentVersion = packageJson.version

  let newVersion

  if (['patch', 'minor', 'major'].includes(input)) {
    newVersion = bumpVersion(currentVersion, input)
  } else if (/^\d+\.\d+\.\d+$/.test(input)) {
    newVersion = input
  } else {
    console.error(`Invalid input: ${input}`)
    console.error(
      'Must be one of: patch, minor, major, or a version like 1.2.3',
    )
    process.exit(1)
  }

  // Validate new version is greater than current (for semver bumps)
  if (['patch', 'minor', 'major'].includes(input)) {
    const current = parseVersion(currentVersion)
    const next = parseVersion(newVersion)
    const currentNum =
      current.major * 10000 + current.minor * 100 + current.patch
    const nextNum = next.major * 10000 + next.minor * 100 + next.patch

    if (nextNum <= currentNum) {
      console.error(
        `New version ${newVersion} must be greater than current version ${currentVersion}`,
      )
      process.exit(1)
    }
  }

  // Update package.json
  packageJson.version = newVersion
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

  console.log(`✓ Updated version: ${currentVersion} → ${newVersion}`)

  // Create release notes file if it doesn't exist
  const releasesDir = resolve(rootDir, 'product', 'releases')

  // Ensure releases directory exists
  if (!existsSync(releasesDir)) {
    mkdirSync(releasesDir, { recursive: true })
  }

  // Check if a release notes file already exists for this version
  const existingFiles = readdirSync(releasesDir)
  const versionPrefix = `v${newVersion}-`
  const existingFile = existingFiles.find((file) =>
    file.startsWith(versionPrefix),
  )

  if (existingFile) {
    console.log(`✓ Release notes file already exists: ${existingFile}`)
  } else {
    // Create a new release notes template
    const slug = input === 'patch' ? 'patch-release' : 'new-release'
    const filename = `v${newVersion}-${slug}.md`
    const filepath = resolve(releasesDir, filename)

    const template = dedent(`
      # Release ${newVersion}

      **Version:** ${newVersion}
      **Release Date:** TBD

      ## Highlights

      - Add your highlights here

      ## Improvements

      - List improvements here

      ## Fixes

      - List bug fixes here
    `)

    writeFileSync(filepath, template + '\n')
    console.log(
      `✓ Created release notes template: product/releases/${filename}`,
    )
  }

  console.log('')
  console.log('Next steps:')
  console.log(
    `  1. Commit: git add . && git commit -m "Bump version to v${newVersion}"`,
  )
  console.log(`  2. Update release notes in product/releases/`)
  console.log(`  3. When ready, merge to main and tag: git tag v${newVersion}`)
}

main()
