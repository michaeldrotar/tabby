import fs from 'fs/promises'
import { statSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import fg from 'fast-glob'
import chalk from 'chalk'

// ============================================================================
// CONFIGURATION - Customize colors, defaults, and formatting here
// ============================================================================

/**
 * Dependency usage overrides
 * Define rules for packages that are used implicitly when certain conditions are met.
 * Format: { when: ['dep1', 'dep2'], alsoUsed: 'package-name', description: 'why' }
 * If all packages in 'when' are used, then 'alsoUsed' is also considered used.
 */
const USAGE_OVERRIDES = [
  {
    when: ['eslint-plugin-import-x', 'typescript'],
    alsoUsed: 'eslint-import-resolver-typescript',
    description:
      'import-x + TypeScript requires this resolver (implicit via config)',
  },
]

const colors = {
  // Primary semantic colors
  dependencies: chalk.hex('#60A5FA'), // Light blue for dependencies
  sourceCode: chalk.hex('#A78BFA'), // Light purple for source/own code
  pages: chalk.hex('#FBBF24'), // Amber for pages
  accent: chalk.hex('#FF69B4'), // Hot pink accent
  muted: chalk.dim, // Muted/secondary text
  border: chalk.hex('#4B5563'), // Dark gray borders

  // Status colors (good -> bad gradient)
  success: chalk.hex('#34D399'), // Emerald
  warning: chalk.hex('#FBBF24'), // Amber
  error: chalk.hex('#F87171'), // Light red

  // Size category scale (tiny -> huge)
  scale: [
    { name: 'Tiny', color: chalk.hex('#34D399') }, // Emerald
    { name: 'Small', color: chalk.hex('#60A5FA') }, // Light blue
    { name: 'Medium', color: chalk.hex('#FBBF24') }, // Amber
    { name: 'Large', color: chalk.hex('#FB923C') }, // Orange
    { name: 'Huge', color: chalk.hex('#F87171') }, // Light red
  ],
}

// Default settings
const defaults = {
  versionsBack: 3, // Number of previous versions to compare
  topDeps: null, // null = show all dependencies
  topFiles: null, // null = show all source files
  barWidth: 30, // Width of progress bars in lists
  scaleWidth: 80, // Width of the size category scale
  maxPathLength: 60, // Max length for file paths before truncating
}

// Line/border characters
const chars = {
  bar: { filled: '█', empty: '░' },
  lines: { h: '─', v: '│', corner: '└', tee: '├' },
  scale: { marker: '◆', line: '─' },
  trend: { up: '↑', down: '↓', same: '─' },
}

// Path simplification rules - folders to strip from source paths
const pathStrip = {
  prefixes: ['pages/', 'packages/'],
  folders: ['dist/', 'src/', 'lib/', 'dist/lib/', 'dist/src/'],
}

const NAMESPACE_PREFIX = '@extension/'

// Package type definitions - id, label, pattern, color, order, packages[]
const packageTypes = [
  {
    id: 'root',
    label: 'ROOT',
    pattern: '.',
    color: (text) => colors.success(text),
    order: 0,
    packages: [],
  },
  {
    id: 'app',
    label: 'APP',
    pattern: 'chrome-extension',
    color: (text) => colors.success(text),
    order: 1,
    packages: [],
  },
  {
    id: 'page',
    label: 'PAGES',
    pattern: 'pages/',
    color: (text) => colors.pages(text),
    order: 2,
    packages: [],
  },
  {
    id: 'package',
    label: 'PKG',
    pattern: null,
    color: (text) => colors.sourceCode(text),
    order: 3,
    packages: [],
  },
]

// Package registry - byName: Map, byType: Map, typeById: Object
const packageRegistry = {
  byName: new Map(),
  byType: new Map(),
  typeById: Object.fromEntries(
    packageTypes.map((typeDef) => [typeDef.id, typeDef]),
  ),
}

const WORKSPACE_PACKAGE_GLOBS = [
  'package.json',
  'packages/*/package.json',
  'pages/*/package.json',
  'chrome-extension/package.json',
]

const ANALYSIS_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/*.map',
  '**/package.json',
  '**/*.md',
  '**/pnpm-lock.yaml',
  '**/package-lock.json',
  '**/yarn.lock',
]

const WORKSPACE_CODE_MARKERS = ['/packages/', 'packages/', '/pages/', '/src/']

const REPO_FOLDER_BLACKLIST = new Set([
  'packages',
  'pages',
  'src',
  'lib',
  'dist',
  'dist-zip',
  '_locales',
  'public',
  'scripts',
  '.pnpm',
  'chrome-extension',
])

const getPackageColor = (typeId) =>
  packageRegistry.typeById[typeId]?.color ??
  packageRegistry.typeById.package.color

const getPackageType = (dir) =>
  packageTypes.find(
    (t) => t.pattern && (dir === t.pattern || dir.startsWith(t.pattern)),
  )?.id ?? 'package'

const stripNamespace = (name) =>
  name.startsWith(NAMESPACE_PREFIX) ? name.slice(NAMESPACE_PREFIX.length) : name

const sortPackagesByType = (packages) =>
  [...packages].sort(([aName, aPkg], [bName, bPkg]) => {
    const orderDiff =
      (packageRegistry.typeById[aPkg.type]?.order ?? 99) -
      (packageRegistry.typeById[bPkg.type]?.order ?? 99)
    return orderDiff !== 0 ? orderDiff : aName.localeCompare(bName)
  })

const resetPackageRegistry = () => {
  packageTypes.forEach((t) => (t.packages = []))
  packageRegistry.byName.clear()
  packageRegistry.byType.clear()
}

// Format dependency list with line wrapping
const formatDependencyList = ({
  workspaceDeps,
  npmDeps,
  unusedSet,
  packageLookup,
  maxLineWidth = 100,
  indentWidth = 25,
}) => {
  const allDeps = [
    ...workspaceDeps
      .filter((d) => packageLookup.get(d)?.type === 'app')
      .sort()
      .map((name) => ({ name, color: colors.success })),
    ...workspaceDeps
      .filter((d) => packageLookup.get(d)?.type === 'page')
      .sort()
      .map((name) => ({ name, color: colors.pages })),
    ...workspaceDeps
      .filter((d) => !['app', 'page'].includes(packageLookup.get(d)?.type))
      .sort()
      .map((name) => ({ name, color: (t) => t })),
    ...npmDeps
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name }) => ({ name, color: colors.muted })),
  ]

  if (allDeps.length === 0) return [colors.muted('(none)')]

  // Wrap lines
  const lines = []
  let line = [],
    lineLen = 0
  allDeps.forEach((dep, idx) => {
    const displayName =
      packageRegistry.byName.get(dep.name)?.displayName || dep.name
    const isLast = idx === allDeps.length - 1
    const colorFn = unusedSet.has(dep.name) ? colors.error : dep.color
    const text = colorFn(displayName) + (isLast ? '' : colors.muted(', '))
    const len = displayName.length + (isLast ? 0 : 2)

    if (line.length && indentWidth + lineLen + len > maxLineWidth) {
      lines.push(line.join(''))
      line = [text]
      lineLen = len
    } else {
      line.push(text)
      lineLen += len
    }
  })
  if (line.length) lines.push(line.join(''))
  return lines
}

// ============================================================================
// DEPENDENCY ANALYSIS - Package dependency tree and import analysis
// ============================================================================

// Collect all workspace packages and their dependencies
async function collectWorkspacePackages() {
  // Reset registry for fresh collection
  resetPackageRegistry()

  // Find all package.json files including root
  const packageJsonPaths = await fg(WORKSPACE_PACKAGE_GLOBS, {
    onlyFiles: true,
  })

  for (const pkgPath of packageJsonPaths) {
    try {
      const pkgContent = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
      const pkgName = pkgContent.name
      const pkgDir = path.dirname(pkgPath)

      // Gather all dependencies from package.json
      const allDeps = {
        ...pkgContent.dependencies,
        ...pkgContent.devDependencies,
      }

      // Split into workspace and npm dependencies
      const workspaceDeps = []
      const npmDeps = []

      for (const [depName, version] of Object.entries(allDeps)) {
        if (version === 'workspace:*') {
          workspaceDeps.push(depName) // Keep full name for workspace deps
        } else {
          npmDeps.push({ name: depName, version })
        }
      }

      // Determine type using centralized rules
      const type = getPackageType(pkgDir)
      const pkg = createPackage({
        name: pkgName,
        dir: pkgDir,
        type,
        dependencies: workspaceDeps,
        npmDependencies: npmDeps,
      })

      // Register in byName map (keyed by full package name)
      packageRegistry.byName.set(pkgName, pkg)

      // Add to the type's packages array
      const typeDef = packageRegistry.typeById[type]
      if (typeDef) {
        typeDef.packages.push(pkg)
      }
    } catch (e) {
      // Skip invalid package.json files
    }
  }

  // Sort packages within each type alphabetically
  for (const typeDef of packageTypes) {
    typeDef.packages.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Build byType map for convenience
  for (const typeDef of packageTypes) {
    packageRegistry.byType.set(typeDef.id, typeDef)
  }

  return packageRegistry.byName
}

// Detect duplicate npm package versions across workspace
function detectDuplicateVersions() {
  const npmVersions = new Map() // npm package -> [{workspacePackage, version}]

  for (const [pkgName, pkg] of packageRegistry.byName) {
    for (const npmDep of pkg.npmDependencies) {
      if (!npmVersions.has(npmDep.name)) {
        npmVersions.set(npmDep.name, [])
      }
      npmVersions.get(npmDep.name).push({
        package: pkgName,
        version: npmDep.version,
      })
    }
  }

  // Filter to only packages with different versions
  const duplicates = new Map()
  for (const [depName, usages] of npmVersions) {
    const uniqueVersions = new Set(usages.map((usage) => usage.version))
    if (uniqueVersions.size > 1) {
      duplicates.set(depName, usages)
    }
  }

  return duplicates
}

// Detect circular dependencies using DFS
function detectCircularDependencies(packages) {
  const cycles = []
  const visited = new Set()
  const recursionStack = new Set()

  const dfs = (pkg, path = []) => {
    if (recursionStack.has(pkg)) {
      // Found a cycle
      const cycleStart = path.indexOf(pkg)
      const cycle = path.slice(cycleStart)
      cycle.push(pkg)
      cycles.push(cycle)
      return
    }

    if (visited.has(pkg)) return

    visited.add(pkg)
    recursionStack.add(pkg)
    path.push(pkg)

    const pkgInfo = packages.get(pkg)
    if (pkgInfo) {
      for (const dep of pkgInfo.dependencies) {
        dfs(dep, [...path])
      }
    }

    recursionStack.delete(pkg)
  }

  for (const pkg of packages.keys()) {
    visited.clear()
    recursionStack.clear()
    dfs(pkg, [])
  }

  // Deduplicate cycles (same cycle might be found from different starting points)
  const uniqueCycles = []
  const seenCycles = new Set()

  for (const cycle of cycles) {
    const normalized = [...cycle]
    normalized.pop() // Remove duplicate end
    normalized.sort()
    const key = normalized.join('→')
    if (!seenCycles.has(key)) {
      seenCycles.add(key)
      uniqueCycles.push(cycle)
    }
  }

  return uniqueCycles
}

// Analyze imports to find undeclared dependencies and CSS imports
async function analyzeImportStatements(packages) {
  const issues = []
  const cssImports = [] // Track CSS imports between packages
  const actualImports = new Map() // Track what each package actually imports
  const actualNpmImports = new Map() // Track npm packages actually used

  for (const [pkgName, pkg] of packages) {
    // Get all files in package directory (not just source files)
    // IMPORTANT: Exclude package.json and markdown files to avoid false positives
    // Scan all files except package.json, markdown, and lock files
    const allFiles = await fg([`${pkg.dir}/**/*`], {
      onlyFiles: true,
      ignore: ANALYSIS_IGNORE_PATTERNS,
    })

    const declaredDeps = new Set(pkg.dependencies)
    const usedDeps = new Set()
    actualImports.set(pkgName, usedDeps)

    // Track which npm dependencies are used
    const usedNpmDeps = new Set()
    actualNpmImports.set(pkgName, usedNpmDeps)
    const npmDepNames = new Set(pkg.npmDependencies.map((dep) => dep.name))

    // For each declared workspace dependency, check if its name appears anywhere in any file
    for (const depName of declaredDeps) {
      for (const file of allFiles) {
        try {
          const content = readFileSync(file, 'utf8')
          // Simple check: does the package name appear in the file?
          // This catches imports, extends, requires, config references, etc.
          if (content.includes(depName)) {
            usedDeps.add(depName)
            break
          }
        } catch (e) {
          // Skip files that can't be read (binary files, etc.)
        }
      }
    }

    // For each npm dependency, check if it appears in any file
    for (const npmDepName of npmDepNames) {
      let found = false

      // For @types/* packages, search for the base package name
      // e.g., @types/chrome -> search for "chrome"
      const searchTerm = npmDepName.startsWith('@types/')
        ? npmDepName.replace('@types/', '')
        : npmDepName

      // Simple text search: does the package name appear anywhere?
      // This catches imports, requires, config references, command usage, etc.
      for (const file of allFiles) {
        try {
          const content = readFileSync(file, 'utf8')
          if (content.includes(searchTerm)) {
            usedNpmDeps.add(npmDepName)
            found = true
            break
          }
        } catch (e) {
          // Skip files that can't be read (binary files, etc.)
        }
      }

      // If not found in files, check package.json (excluding deps fields)
      if (!found) {
        try {
          const pkgJsonPath =
            pkg.dir === '.'
              ? 'package.json'
              : path.join(pkg.dir, 'package.json')
          const pkgJsonContent = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))

          // Check all fields except dependencies/devDependencies/peerDependencies
          // This catches scripts, postcss config, eslint config, etc.
          const { dependencies, devDependencies, peerDependencies, ...rest } =
            pkgJsonContent
          const restString = JSON.stringify(rest)
          if (restString.includes(searchTerm)) {
            usedNpmDeps.add(npmDepName)
            found = true
          }
        } catch (e) {
          // Skip if can't read package.json
        }
      }

      // For root package, also check child workspace package.json files
      if (!found && pkg.dir === '.') {
        try {
          const workspacePackageJsons = await fg(
            ['{pages,packages,chrome-extension}/*/package.json'],
            {
              onlyFiles: true,
            },
          )

          for (const childPkgPath of workspacePackageJsons) {
            try {
              const childPkgContent = JSON.parse(
                readFileSync(childPkgPath, 'utf8'),
              )
              const {
                dependencies,
                devDependencies,
                peerDependencies,
                ...rest
              } = childPkgContent
              const restString = JSON.stringify(rest)
              if (restString.includes(searchTerm)) {
                usedNpmDeps.add(npmDepName)
                found = true
                break
              }
            } catch (e) {
              // Skip malformed child package.json
            }
          }
        } catch (e) {
          // Skip if can't read child packages
        }
      }
    }

    // Apply usage overrides: packages that are used when certain conditions are met
    for (const override of USAGE_OVERRIDES) {
      if (
        npmDepNames.has(override.alsoUsed) &&
        !usedNpmDeps.has(override.alsoUsed)
      ) {
        // Check if all required packages are used
        const allRequiredUsed = override.when.every((req) =>
          usedNpmDeps.has(req),
        )
        if (allRequiredUsed) {
          usedNpmDeps.add(override.alsoUsed)
        }
      }
    }

    // Check peer dependencies: if a used package lists something as a peer dep, consider it used
    // This catches packages like jiti (peer dep of eslint) that are used implicitly
    for (const npmDepName of npmDepNames) {
      if (!usedNpmDeps.has(npmDepName)) {
        // Check if this is a peer dependency of any used package
        try {
          for (const usedDepName of usedNpmDeps) {
            const usedDepPkgPath = path.join(
              'node_modules',
              usedDepName,
              'package.json',
            )
            if (existsSync(usedDepPkgPath)) {
              const usedDepPkg = JSON.parse(
                readFileSync(usedDepPkgPath, 'utf8'),
              )
              if (usedDepPkg.peerDependencies?.[npmDepName]) {
                usedNpmDeps.add(npmDepName)
                break
              }
            }
          }
        } catch (e) {
          // Skip if can't read peer dependencies
        }
      }
    }

    // Now check for undeclared imports and CSS imports in source files
    const sourceFiles = await fg([`${pkg.dir}/**/*.{ts,tsx,js,jsx,css}`], {
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/dist/**'],
    })

    for (const file of sourceFiles) {
      try {
        const content = readFileSync(file, 'utf8')
        const isCssFile = file.endsWith('.css')

        // Escape namespace prefix for use in regex
        const escapedPrefix = NAMESPACE_PREFIX.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )

        if (isCssFile) {
          // Match CSS imports: @import '@extension/...' or url('@extension/...')
          const cssImportRegex = new RegExp(
            `@import\\s+['"]${escapedPrefix}([^/'"\\s]+)|url\\(['"]${escapedPrefix}([^/'"\\s]+)`,
            'g',
          )
          let match
          while ((match = cssImportRegex.exec(content)) !== null) {
            const importedPkg = match[1] || match[2]
            if (importedPkg && importedPkg !== pkgName) {
              cssImports.push({
                from: pkgName,
                to: importedPkg,
                file: path.relative(process.cwd(), file),
                type: 'css',
              })
            }
          }
        } else {
          // Match JS/TS import statements: import ... from '@extension/...'
          const importRegex = new RegExp(
            `import\\s+(?:[\\s\\S]*?)\\s+from\\s+['"]${escapedPrefix}([^/'"\\s]+)`,
            'g',
          )
          let match

          while ((match = importRegex.exec(content)) !== null) {
            const importedPkg = match[1]
            // Skip if it's importing from itself
            if (importedPkg === pkgName) continue

            // Check if this import is declared in package.json
            if (!declaredDeps.has(importedPkg)) {
              issues.push({
                package: pkgName,
                file: path.relative(process.cwd(), file),
                imports: importedPkg,
                type: 'undeclared',
              })
            }
          }
        }
      } catch (e) {
        // Skip files that can't be read
      }
    }
  }

  // Deduplicate issues (same package importing same undeclared dep)
  const uniqueIssues = new Map()
  for (const issue of issues) {
    const key = `${issue.package}→${issue.imports}`
    if (!uniqueIssues.has(key)) {
      uniqueIssues.set(key, { ...issue, files: [issue.file] })
    } else {
      uniqueIssues.get(key).files.push(issue.file)
    }
  }

  return {
    issues: [...uniqueIssues.values()],
    cssImports,
    actualImports,
    actualNpmImports,
  }
}

// Detect unused dependencies (declared but not imported)
function detectUnusedDependencies(packages, actualImports, actualNpmImports) {
  const unused = []

  for (const [pkgName, pkg] of packages) {
    // Check workspace dependencies
    const declaredDeps = new Set(pkg.dependencies)
    const usedDeps = actualImports.get(pkgName) || new Set()

    for (const dep of declaredDeps) {
      if (!usedDeps.has(dep)) {
        unused.push({
          package: pkgName,
          dependency: dep,
        })
      }
    }

    // Check npm dependencies (now on package object)
    const usedNpmDeps = actualNpmImports.get(pkgName) || new Set()

    for (const npmDep of pkg.npmDependencies) {
      if (!usedNpmDeps.has(npmDep.name)) {
        unused.push({
          package: pkgName,
          dependency: npmDep.name,
        })
      }
    }
  }

  return unused
}

// Detect reverse dependency issues (A depends on B, but B uses things from A)
async function detectReverseDependencies(packages) {
  const issues = []

  // Look for CSS variable definitions and usages
  const cssVarDefinitions = new Map() // package -> Set of var names defined
  const cssVarUsages = new Map() // package -> Map of var name -> files

  for (const [pkgName, pkg] of packages) {
    const cssFiles = await fg([`${pkg.dir}/**/*.css`], {
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/dist/**'],
    })

    cssVarDefinitions.set(pkgName, new Set())
    cssVarUsages.set(pkgName, new Map())

    for (const file of cssFiles) {
      try {
        const content = readFileSync(file, 'utf8')

        // Find CSS variable definitions: --variable-name:
        const defRegex = /--([\w-]+)\s*:/g
        let match
        while ((match = defRegex.exec(content)) !== null) {
          cssVarDefinitions.get(pkgName).add(match[1])
        }

        // Find CSS variable usages: var(--variable-name)
        const useRegex = /var\(\s*--([\w-]+)/g
        while ((match = useRegex.exec(content)) !== null) {
          const varName = match[1]
          if (!cssVarUsages.get(pkgName).has(varName)) {
            cssVarUsages.get(pkgName).set(varName, [])
          }
          cssVarUsages
            .get(pkgName)
            .get(varName)
            .push(path.relative(process.cwd(), file))
        }
      } catch (e) {
        // Skip
      }
    }
  }

  // Now check for reverse dependencies:
  // If package A depends on package B, but B uses CSS vars defined only in A
  for (const [pkgA, pkgAInfo] of packages) {
    for (const depB of pkgAInfo.dependencies) {
      const varsDefinedInA = cssVarDefinitions.get(pkgA)
      const varsUsedByB = cssVarUsages.get(depB)

      if (!varsDefinedInA || !varsUsedByB) continue

      // Check if B uses vars that are ONLY defined in A (not in B itself)
      const varsDefinedInB = cssVarDefinitions.get(depB) || new Set()

      for (const [varName, files] of varsUsedByB) {
        if (varsDefinedInA.has(varName) && !varsDefinedInB.has(varName)) {
          // B uses a variable defined in A but not in B
          issues.push({
            dependent: depB,
            dependency: pkgA,
            varName,
            files,
            description: `${depB} uses --${varName} which is defined in ${pkgA} (potential reverse dependency)`,
          })
        }
      }
    }
  }

  // Deduplicate by dependent/dependency pair
  const uniqueIssues = new Map()
  for (const issue of issues) {
    const key = `${issue.dependent}→${issue.dependency}`
    if (!uniqueIssues.has(key)) {
      uniqueIssues.set(key, { ...issue, vars: [issue.varName] })
    } else {
      if (!uniqueIssues.get(key).vars.includes(issue.varName)) {
        uniqueIssues.get(key).vars.push(issue.varName)
      }
    }
  }

  return [...uniqueIssues.values()]
}

// Build dependency layers (topological sort)
function buildDependencyLayers(packages) {
  const layers = []
  const placed = new Set()
  const remaining = new Set(packages.keys())

  // First pass: find packages with no dependencies (base layer)
  while (remaining.size > 0) {
    const layer = []
    for (const pkg of remaining) {
      const pkgInfo = packages.get(pkg)
      const deps = pkgInfo?.dependencies || []
      // Check if all dependencies are already placed
      if (deps.every((dep) => placed.has(dep) || !packages.has(dep))) {
        layer.push(pkg)
      }
    }

    if (layer.length === 0) {
      // No progress - remaining packages have circular deps
      // Add all remaining to a final layer
      layer.push(...remaining)
      layers.push(layer)
      break
    }

    layers.push(layer)
    for (const pkg of layer) {
      placed.add(pkg)
      remaining.delete(pkg)
    }
  }

  return layers
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// ----------------------------------------------------------------------------
// Formatting Utilities - Size and path formatting for display
// ----------------------------------------------------------------------------

const human = (bytes) => {
  const parts = humanParts(bytes)
  return `${parts.value} ${parts.unit}`
}

const humanParts = (bytes) => {
  const abs = Math.abs(bytes),
    KB = 1024,
    MB = KB * 1024,
    GB = MB * 1024
  if (abs >= GB) return { value: (bytes / GB).toFixed(2), unit: 'GB' }
  if (abs >= MB) return { value: (bytes / MB).toFixed(2), unit: 'MB' }
  if (abs >= KB) return { value: (bytes / KB).toFixed(2), unit: 'KB' }
  return { value: bytes.toString(), unit: 'B' }
}

const simplifyPath = (filePath, maxLen = defaults.maxPathLength) => {
  let result = filePath.replace(/^(?:\.\.\/)+/, '')

  // Strip known prefixes (pages/, packages/)
  for (const prefix of pathStrip.prefixes) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length)
      break
    }
  }

  // Strip intermediate folders (dist/, src/, lib/)
  for (const folder of pathStrip.folders) {
    result = result.replace(
      new RegExp(`/${folder.replace('/', '\\/')}`, 'g'),
      '/',
    )
    if (result.startsWith(folder)) {
      result = result.slice(folder.length)
    }
  }

  // Clean up any double slashes
  result = result.replace(/\/+/g, '/')

  // Truncate from the front if still too long, keeping filename visible
  if (result.length > maxLen) {
    const parts = result.split('/')
    const filename = parts.pop()
    let truncated = filename

    // Add path parts from the end until we hit the limit
    for (
      let i = parts.length - 1;
      i >= 0 && truncated.length < maxLen - 3;
      i--
    ) {
      const next = parts[i] + '/' + truncated
      if (next.length <= maxLen - 3) {
        truncated = next
      } else {
        break
      }
    }

    if (truncated !== result) {
      result = '…/' + truncated
    }
  }

  return result
}

// ----------------------------------------------------------------------------
// Display Utilities - Visual elements for CLI output
// ----------------------------------------------------------------------------

const progressBar = (
  percent,
  width = defaults.barWidth,
  color = colors.accent,
) => {
  const filled = Math.round((percent / 100) * width)
  return (
    color(chars.bar.filled.repeat(filled)) +
    colors.border(chars.bar.empty.repeat(width - filled))
  )
}

const sectionHeader = (title) =>
  `\n${chalk.bold.white(title)}\n${colors.muted(chars.lines.h.repeat(title.length + 2))}`

const subHeader = (title) =>
  `\n${colors.muted(chars.lines.tee + chars.lines.h)} ${chalk.bold(title)}`

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let spinnerIndex = 0
const getSpinner = () => SPINNER_FRAMES[spinnerIndex++ % SPINNER_FRAMES.length]
const showProgress = (msg) =>
  process.stdout.write(`\r${chalk.cyan(getSpinner())} ${msg}${' '.repeat(20)}`)
const clearProgress = () => process.stdout.write('\r' + ' '.repeat(100) + '\r')

// ----------------------------------------------------------------------------
// System Utilities - Shell commands and file operations
// ----------------------------------------------------------------------------

// Run a shell command and capture output
const runCmd = (command, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else
        reject(
          new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`),
        )
    })
  })

// Normalize asset names by removing Vite hash suffixes
const normalizeAssetName = (assetPath) => {
  if (!assetPath || assetPath.endsWith('.map')) return null
  let normalized = assetPath.replace(/^\.\/|^\//, '')
  if (normalized.startsWith('dist/')) normalized = normalized.slice(5)
  return normalized.replace(
    /-(?=(?:.*[A-Z])|(?:.*_))([A-Za-z0-9_-]{6,})(?=\.[^.]+$)/g,
    '',
  )
}

const parseSemver = (v) => {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)$/)
  return m ? [+m[1], +m[2], +m[3]] : null
}

// ----------------------------------------------------------------------------
// Package Utilities - Package object creation and manipulation
// ----------------------------------------------------------------------------

const createPackage = ({
  name,
  dir,
  type,
  dependencies = [],
  npmDependencies = [],
}) => ({
  name,
  dir,
  type,
  displayName: stripNamespace(name),
  color: (packageRegistry.typeById[type] ?? packageRegistry.typeById.package)
    .color,
  dependencies,
  npmDependencies,
})

// ============================================================================
// BUNDLE ANALYSIS - Zip contents and sourcemap analysis
// ============================================================================

const calculateSizeCategory = (zippedBytes) => {
  const kb = zippedBytes / 1024
  const boundaries = [0, 100, 500, 1000, 2000, 10000]
  let idx = colors.scale.findIndex(
    (_, i) => kb >= boundaries[i] && kb < boundaries[i + 1],
  )
  if (idx < 0) idx = colors.scale.length - 1
  const cat = colors.scale[idx]
  const catWidth = 1 / colors.scale.length
  const posInCat =
    (kb - boundaries[idx]) / (boundaries[idx + 1] - boundaries[idx])
  return {
    name: cat.name,
    color: cat.color,
    pos: idx * catWidth + posInCat * catWidth,
  }
}

// Build zip version data from zip contents
const buildZipVersionData = (zipContents, versionsBack) => {
  const zipVersions = []
  const zipIndex = {} // version -> { zipPath, mtimeMs, totalUncompressed, actualBytes }
  const zipEntriesMap = {} // version -> normalized -> uncompressed

  for (const zipContent of zipContents) {
    const base = path.basename(zipContent.zip)
    const versionMatch = base.match(/-(\d+\.\d+\.\d+)\.zip$/)
    const version = versionMatch ? versionMatch[1] : base
    zipVersions.push(version)
    try {
      const stat = statSync(zipContent.zip)
      zipIndex[version] = {
        zipPath: zipContent.zip,
        mtimeMs: stat.mtimeMs,
        totalUncompressed: 0,
        actualBytes: stat.size,
      }
    } catch (_statErr) {
      zipIndex[version] = {
        zipPath: zipContent.zip,
        mtimeMs: 0,
        totalUncompressed: 0,
        actualBytes: 0,
      }
    }
    zipEntriesMap[version] = {}
    for (const entry of zipContent.entries || []) {
      const normalized = normalizeAssetName(entry.name)
      if (!normalized) continue
      zipEntriesMap[version][normalized] = entry.uncompressed
      zipIndex[version].totalUncompressed += entry.uncompressed || 0
    }
  }

  // Sort zip versions from highest to lowest (semver where possible)
  const sortedVersions = [...new Set(zipVersions)].sort((a, b) => {
    const semverA = parseSemver(a)
    const semverB = parseSemver(b)
    if (semverA && semverB) {
      for (let idx = 0; idx < 3; idx++)
        if (semverA[idx] !== semverB[idx]) return semverB[idx] - semverA[idx]
      return 0
    }
    if (semverA && !semverB) return -1
    if (!semverA && semverB) return 1
    return String(b).localeCompare(String(a), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  })

  // If a tabby-dist (working) zip exists, ensure it's included and shown first
  const tabbyDistIdx = sortedVersions.findIndex((ver) =>
    String(ver).startsWith('tabby-dist'),
  )
  let versions = []
  if (tabbyDistIdx !== -1) {
    const [tabbyDist] = sortedVersions.splice(tabbyDistIdx, 1)
    versions = [tabbyDist, ...sortedVersions.slice(0, versionsBack)]
  } else {
    versions = sortedVersions.slice(0, versionsBack)
  }

  // Find the tabby-dist version (current working version)
  const tabbyDistVersion = versions.find((ver) =>
    String(ver).startsWith('tabby-dist'),
  )

  // Build the union of all asset names from selected versions
  const allNames = new Set(
    versions.flatMap((ver) => Object.keys(zipEntriesMap[ver] || {})),
  )

  // For ordering: find the most recent (largest) size for each asset across all versions
  const nameMeta = []
  for (const name of allNames) {
    let recentSize = 0
    if (
      tabbyDistVersion &&
      zipEntriesMap[tabbyDistVersion] &&
      zipEntriesMap[tabbyDistVersion][name] != null
    ) {
      recentSize = zipEntriesMap[tabbyDistVersion][name]
    } else {
      for (const ver of versions) {
        if (zipEntriesMap[ver] && zipEntriesMap[ver][name] != null) {
          recentSize = Math.max(recentSize, zipEntriesMap[ver][name])
        }
      }
    }
    nameMeta.push({ name, recentSize })
  }
  nameMeta.sort((a, b) => b.recentSize - a.recentSize)

  // Display versions (exclude tabby-dist since we show it as "Current")
  const displayVersions = versions.filter(
    (ver) => !String(ver).startsWith('tabby-dist'),
  )

  return {
    versions,
    displayVersions,
    tabbyDistVersion,
    zipIndex,
    zipEntriesMap,
    nameMeta,
    allNames,
  }
}

const calculateBundleTotals = (deps, own, totalMapped) => {
  const depsBytes = deps.reduce((s, d) => s + d.bytes, 0)
  const ownBytes = own.reduce((s, f) => s + f.bytes, 0)
  return {
    depsBytes,
    ownBytes,
    totalSize: depsBytes + ownBytes,
    depsPercent: totalMapped > 0 ? (depsBytes / totalMapped) * 100 : 0,
    ownPercent: totalMapped > 0 ? (ownBytes / totalMapped) * 100 : 0,
  }
}

const calculateCurrentVersionStats = (tabbyDistVersion, zipContents) => {
  const currentEntries = tabbyDistVersion
    ? zipContents.find((zc) => zc.zip.includes('tabby-dist'))?.entries || []
    : []
  return {
    currentEntries,
    currentUncompressed: currentEntries.reduce((s, e) => s + e.uncompressed, 0),
    currentZipped: currentEntries.reduce((s, e) => s + e.compressed, 0),
    currentFileCount: currentEntries.length,
  }
}

// Detect duplicate bundled dependencies (same package with different versions in bundle)
const detectDuplicateBundledDeps = (deps) => {
  const map = new Map()
  deps.forEach((d) => {
    const base = d.name.replace(/@[0-9.]+(_.*)?$/, '').replace(/\+.*$/, '')
    if (!map.has(base)) map.set(base, [])
    map.get(base).push(d.name)
  })
  return [...map.entries()].filter(([, v]) => v.length > 1)
}

async function listZipContents() {
  const zips = await fg(['dist-zip/*.zip'], { onlyFiles: true })
  const results = []
  for (const zipPath of zips) {
    try {
      // Prefer unzip -v for a fast listing
      const { stdout } = await runCmd('unzip', ['-v', zipPath])
      const lines = stdout.split(/\r?\n/)
      const entries = []
      for (const line of lines) {
        // lines that look like: <spaces><uncompressed> <method> <compressed> ... <name>
        const match = line.match(
          /^\s*(\d+)\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+(.*)$/,
        )
        if (match) {
          const uncompressed = Number(match[1])
          const compressed = Number(match[2])
          const name = match[3].trim()
          entries.push({ name, uncompressed, compressed })
        }
      }
      entries.sort((a, b) => b.compressed - a.compressed)
      results.push({ zip: zipPath, entries })
    } catch (err) {
      // unzip not available or failed, fallback to just zip file size
      try {
        const stat = await fs.stat(zipPath)
        results.push({
          zip: zipPath,
          entries: [],
          error: err.message,
          bytes: stat.size,
        })
      } catch (_statErr) {
        results.push({ zip: zipPath, entries: [], error: err.message })
      }
    }
  }
  return results
}

async function analyzeSourcemaps(jsFiles) {
  // For each js file with a sourcemap, parse the .map file (prefer embedded sourcesContent, otherwise estimate via on-disk files)
  const perPackage = new Map()
  const perOwn = new Map()
  let totalMapped = 0

  // Helper: extract a package name from a source path. Handles common layouts:
  // - regular node_modules/packagename
  // - pnpm store: .pnpm/<pkg>@<ver>/...
  const stripVersion = (seg) =>
    seg
      .replace(/@[^@/]+$/, '')
      .replace(/\+/g, '/')
      .replace(/%2F/gi, '/')
      .replace(/%40/gi, '@')

  const getPackageNameFromSource = (src) => {
    if (!src || typeof src !== 'string') return null

    // normalize separators
    const parts = src.split(/[\/]/).filter(Boolean)

    // 1) standard node_modules path (prefer explicit package folder)
    const nmIdx = parts.indexOf('node_modules')
    if (nmIdx !== -1 && parts.length > nmIdx + 1) {
      let candidate = parts[nmIdx + 1]
      if (!candidate || candidate === '.' || candidate === '..') return null
      // if we see node_modules/.pnpm/... then scan forward for the real package name
      if (candidate === '.pnpm') {
        for (let j = nmIdx + 2; j < Math.min(parts.length, nmIdx + 8); j++) {
          const maybe = stripVersion(parts[j])
          if (!maybe || maybe === '.' || maybe === '..') continue
          if (maybe && !REPO_FOLDER_BLACKLIST.has(maybe)) {
            return maybe
          }
        }
      }
      if (!REPO_FOLDER_BLACKLIST.has(candidate)) {
        return stripVersion(candidate)
      }
    }

    // 2) pnpm store folder: .pnpm/<pkg>@<ver>/... - try to grab the pkg from the path
    const pnpmIdx = parts.indexOf('.pnpm')
    if (pnpmIdx !== -1) {
      // look at next few segments to find something like <pkg>@<ver> or encoded pkg
      for (let i = pnpmIdx + 1; i < Math.min(parts.length, pnpmIdx + 6); i++) {
        const seg = parts[i]
        if (!seg) continue
        // segment may be like "pkg@version" or "@scope+pkg@version" or encoded
        const name = stripVersion(seg)
        // sanity check: name should contain letters or @ (for scoped) and not be repo dirs
        if (/[a-z0-9@_-]+/i.test(name) && !REPO_FOLDER_BLACKLIST.has(name))
          return name
      }
    }

    // 3) fallback: look for first package-like segment in path, but avoid repo folders
    for (const seg of parts) {
      if (!seg) continue
      const s = stripVersion(seg)
      if (REPO_FOLDER_BLACKLIST.has(s)) continue
      // Accept if it looks scoped or hyphenated *or* exists under node_modules
      const looksLikePackage = s.startsWith('@') || s.includes('-')
      const existsInNodeModules =
        existsSync(path.resolve('node_modules', s)) ||
        existsSync(path.resolve('node_modules', s, 'package.json'))
      if ((looksLikePackage || existsInNodeModules) && s.length < 80) return s
    }

    return null
  }

  for (const jsFile of jsFiles) {
    const mapPath = jsFile + '.map'
    if (!existsSync(mapPath)) continue

    // Read and parse the .map file directly — prefer embedded sourcesContent, otherwise resolve
    // source files on disk to estimate sizes.
    let sourcesAcc = {}
    try {
      const mapRaw = await fs.readFile(mapPath, 'utf8')
      let mapJson = null
      try {
        mapJson = JSON.parse(mapRaw)
      } catch (_parseErr) {
        mapJson = null
      }

      if (
        !mapJson ||
        !Array.isArray(mapJson.sources) ||
        !mapJson.sources.length
      ) {
        console.log(
          colors.warning(
            `Fallback: .map file has no "sources" array for ${jsFile} (or could not parse .map).`,
          ),
        )
        continue
      }

      const srcRoot = mapJson.sourceRoot || ''
      for (let i = 0; i < mapJson.sources.length; i++) {
        const src = mapJson.sources[i]
        let bytes = 0

        if (
          Array.isArray(mapJson.sourcesContent) &&
          mapJson.sourcesContent[i]
        ) {
          bytes = Buffer.byteLength(mapJson.sourcesContent[i], 'utf8')
        } else {
          let candidate = src.replace(/^webpack:\/\//, '').replace(/^~\//, '')
          if (srcRoot) candidate = path.join(srcRoot, candidate)

          const tryPaths = [
            path.resolve(path.dirname(mapPath), candidate),
            path.resolve(candidate),
          ]
          if (candidate.includes('node_modules')) {
            const idx = candidate.indexOf('node_modules')
            tryPaths.push(path.resolve(candidate.slice(idx)))
          }

          for (const cp of tryPaths) {
            if (existsSync(cp)) {
              try {
                const st = await fs.stat(cp)
                bytes = st.size
                break
              } catch (e) {
                // ignore
              }
            }
          }
        }

        if (bytes > 0) sourcesAcc[src] = (sourcesAcc[src] || 0) + bytes
      }

      if (!Object.keys(sourcesAcc).length) {
        console.log(
          colors.warning(
            `Fallback parsing of ${mapPath} produced no source sizes.`,
          ),
        )
        continue
      }
    } catch (e) {
      console.log(
        colors.warning(`Failed reading/parsing ${mapPath}: ${String(e)}`),
      )
      continue
    }

    for (const [src, bytes] of Object.entries(sourcesAcc)) {
      const b = Number(bytes || 0)
      totalMapped += b

      // Heuristics: if the source path looks like local workspace code, classify as own
      // BUT exclude node_modules even if path contains /packages/ or /src/
      const srcLower = String(src)
      const isNodeModules = srcLower.includes('node_modules')
      const isOwnCode =
        !isNodeModules &&
        WORKSPACE_CODE_MARKERS.some((marker) => srcLower.includes(marker))

      if (isOwnCode) {
        perOwn.set(src, (perOwn.get(src) || 0) + b)
        continue
      }

      const pkg = getPackageNameFromSource(src)
      if (pkg && pkg !== '.' && pkg !== '..') {
        perPackage.set(pkg, (perPackage.get(pkg) || 0) + b)
      } else {
        perOwn.set(src, (perOwn.get(src) || 0) + b)
      }
    }
  }

  // Clean up dependency names: remove peer dependency suffixes like _@types/react-dom@19.2.3_@types/react@19.2.7__
  const cleanDependencyName = (name) => {
    // Remove everything after the first underscore that looks like a peer dep marker
    // e.g., @radix-ui/react-scroll-area@1.2.10_@types/react-dom... -> @radix-ui/react-scroll-area@1.2.10
    return name.replace(/_[@a-z].*$/i, '')
  }

  const deps = [...perPackage.entries()]
    .map(([name, bytes]) => ({ name: cleanDependencyName(name), bytes }))
    .sort((a, b) => b.bytes - a.bytes)
  const own = [...perOwn.entries()]
    .map(([path, bytes]) => ({ path, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
  return { deps, own, totalMapped }
}

// ============================================================================
// CLI - Argument parsing and help display
// ============================================================================

const parseArguments = (argv) => {
  const args = {
    help: argv.includes('--help') || argv.includes('-h'),
    versionsBack: defaults.versionsBack,
    topLimit: defaults.topDeps,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const nextVal = argv[i + 1]

    if (arg === '-v' || arg === '--versions') {
      const parsed = Number(nextVal)
      if (!Number.isNaN(parsed) && parsed > 0) {
        args.versionsBack = parsed
        i++
      }
    } else if (arg === '-t' || arg === '--top') {
      const parsed = Number(nextVal)
      if (!Number.isNaN(parsed) && parsed > 0) {
        args.topLimit = parsed
        i++
      }
    }
  }

  return args
}

const showHelp = () => {
  console.log(
    '\n' +
      colors.accent.bold('Tabby Bundle Analyzer') +
      '\n' +
      colors.muted('Analyze bundle sizes, dependencies, and trends') +
      '\n\n' +
      chalk.bold('Usage:') +
      '\n' +
      '  pnpm measure [options]\n\n' +
      chalk.bold('Options:') +
      '\n' +
      '  ' +
      colors.accent('-v, --versions <n>') +
      '         Number of versions to compare (default: ' +
      defaults.versionsBack +
      ')\n' +
      '  ' +
      colors.accent('-t, --top <n>') +
      '              Number of top items to show (default: all)\n' +
      '  ' +
      colors.accent('-h, --help') +
      '                 Show this help message\n\n' +
      chalk.bold('Examples:') +
      '\n' +
      '  pnpm measure                  Analyze with defaults\n' +
      '  pnpm measure -v 5             Compare last 5 versions\n' +
      '  pnpm measure -t 20            Show top 20 items\n',
  )
}

const showWelcome = () => {
  console.log('\n' + chalk.bold.white('Tabby Bundle Analyzer'))
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━') + '\n')
}

// ============================================================================
// PRINT FUNCTIONS - Display output sections
// ============================================================================

const formatDelta = (delta, deltaPercent, colorFn) => {
  const sign = delta > 0 ? '+' : ''
  return (
    colors.muted(' (') +
    colorFn(`${sign}${human(delta)}`) +
    colors.muted(' / ') +
    colorFn(`${sign}${deltaPercent.toFixed(1)}%`) +
    colors.muted(')')
  )
}

const printBundleOverview = (results) => {
  const {
    sizeCategory,
    versions,
    displayVersions,
    zipIndex,
    zipEntriesMap,
    tabbyDistVersion,
    currentUncompressed,
    currentZipped,
    currentFileCount,
    depsBytes,
    ownBytes,
    depsPercent,
    ownPercent,
  } = results

  console.log(sectionHeader('Bundle Overview'))

  // Size category with visual scale
  const scaleWidth = defaults.scaleWidth
  const scalePos = Math.floor(sizeCategory.pos * scaleWidth)
  const scaleBefore = chars.scale.line.repeat(scalePos)
  const scaleAfter = chars.scale.line.repeat(scaleWidth - scalePos - 1)
  const scaleBar =
    colors.border(scaleBefore) +
    sizeCategory.color(chars.scale.marker) +
    colors.border(scaleAfter)

  // Build scale labels with proper spacing
  const scaleLabels = colors.scale.map((scaleDef) =>
    scaleDef.color(scaleDef.name),
  )
  const labelSpacing = Math.floor(scaleWidth / colors.scale.length) - 4
  const labelLine = scaleLabels
    .map((label) => label + ' '.repeat(Math.max(2, labelSpacing)))
    .join('')

  console.log('')
  console.log(
    colors.muted(chars.lines.v) +
      ' ' +
      chalk.bold('Size: ') +
      sizeCategory.color.bold(sizeCategory.name),
  )
  console.log(colors.muted(chars.lines.v) + ' ' + scaleBar)
  console.log(colors.muted(chars.lines.v) + ' ' + labelLine)

  // Current size with version comparison
  const currentVersion = versions.find((ver) =>
    String(ver).startsWith('tabby-dist'),
  )
    ? 'Current'
    : versions[0]
  console.log(
    '\n' +
      colors.muted(chars.lines.v) +
      ' ' +
      chalk.bold('Version: ') +
      colors.accent(currentVersion || 'dist'),
  )

  // Show comparison if previous version exists
  if (displayVersions.length > 0) {
    const prevVersion = displayVersions[0]
    const prevIndex = zipIndex[prevVersion]
    const prevZipped = prevIndex ? prevIndex.actualBytes : 0
    const prevUncompressed = prevIndex ? prevIndex.totalUncompressed : 0
    const prevFileCount = Object.keys(zipEntriesMap[prevVersion] || {}).length

    const zippedDelta = currentZipped - prevZipped
    const uncompressedDelta = currentUncompressed - prevUncompressed
    const fileCountDelta = currentFileCount - prevFileCount
    const zippedDeltaPercent =
      prevZipped > 0 ? (zippedDelta / prevZipped) * 100 : 0
    const uncompressedDeltaPercent =
      prevUncompressed > 0 ? (uncompressedDelta / prevUncompressed) * 100 : 0

    const zippedColor =
      zippedDelta > 0
        ? colors.error
        : zippedDelta < 0
          ? colors.success
          : colors.border
    const uncompressedColor =
      uncompressedDelta > 0
        ? colors.error
        : uncompressedDelta < 0
          ? colors.success
          : colors.border
    const fileCountColor =
      fileCountDelta > 0
        ? colors.error
        : fileCountDelta < 0
          ? colors.success
          : colors.border

    console.log(
      colors.muted(chars.lines.v + '   Uncompressed: ') +
        chalk.white(human(currentUncompressed)) +
        (uncompressedDelta !== 0
          ? formatDelta(
              uncompressedDelta,
              uncompressedDeltaPercent,
              uncompressedColor,
            )
          : ''),
    )
    console.log(
      colors.muted(chars.lines.v + '   Zipped:       ') +
        chalk.white.bold(human(currentZipped)) +
        (zippedDelta !== 0
          ? formatDelta(zippedDelta, zippedDeltaPercent, zippedColor)
          : ''),
    )
    console.log(
      colors.muted(chars.lines.v + '   Files:        ') +
        chalk.white(currentFileCount) +
        (fileCountDelta !== 0
          ? colors.muted(' (') +
            fileCountColor(
              `${fileCountDelta > 0 ? '+' : ''}${fileCountDelta}`,
            ) +
            colors.muted(' / ') +
            fileCountColor(
              `${fileCountDelta > 0 ? '+' : ''}${((fileCountDelta / prevFileCount) * 100).toFixed(1)}%`,
            ) +
            colors.muted(')')
          : ''),
    )
  } else {
    console.log(
      colors.muted(chars.lines.v + '   Uncompressed: ') +
        chalk.white(human(currentUncompressed)),
    )
    console.log(
      colors.muted(chars.lines.v + '   Zipped:       ') +
        chalk.white.bold(human(currentZipped)),
    )
    console.log(
      colors.muted(chars.lines.v + '   Files:        ') +
        chalk.white(currentFileCount),
    )
  }

  // Deps vs Own with bars
  console.log(
    '\n' + colors.muted(chars.lines.v) + ' ' + chalk.bold('Code Composition:'),
  )
  const depsBar = progressBar(depsPercent, 50, colors.dependencies)
  const ownBar = progressBar(ownPercent, 50, colors.sourceCode)
  console.log(
    colors.muted(chars.lines.v + '   Dependencies: ') +
      depsBar +
      colors.dependencies(` ${depsPercent.toFixed(1)}%`) +
      colors.border(` (${human(depsBytes)})`),
  )
  console.log(
    colors.muted(chars.lines.corner + '   Source Code:  ') +
      ownBar +
      colors.sourceCode(` ${ownPercent.toFixed(1)}%`) +
      colors.border(` (${human(ownBytes)})`),
  )
}

const printDependencies = (results, topLimit) => {
  const { deps, totalSize, actualDuplicates } = results

  console.log(sectionHeader('Dependencies'))

  const topDeps =
    topLimit !== null
      ? deps.sort((a, b) => b.bytes - a.bytes).slice(0, topLimit)
      : deps.sort((a, b) => b.bytes - a.bytes)
  const maxDepSize = topDeps.length > 0 ? topDeps[0].bytes : 1

  if (topLimit !== null) {
    console.log('\n' + colors.muted(`Showing top ${topLimit} by size:\n`))
  } else {
    console.log('')
  }
  for (const dep of topDeps) {
    const pct =
      totalSize > 0 ? ((dep.bytes / totalSize) * 100).toFixed(1) : '0.0'
    const relativePct = (dep.bytes / maxDepSize) * 100
    const bar = progressBar(relativePct, defaults.barWidth, colors.dependencies)
    const sizeStr = human(dep.bytes).padEnd(13)
    const pctStr = `${pct}%`.padEnd(6)
    console.log(
      `  ${bar} ${chalk.white(sizeStr)} ${colors.dependencies(pctStr)} ${colors.muted(dep.name)}`,
    )
  }

  // Duplicate check
  if (actualDuplicates.length > 0) {
    console.log('\n' + colors.warning('! Duplicate packages detected:'))
    for (const [pkgBase, pkgVersions] of actualDuplicates) {
      console.log(
        colors.warning(`  ${chars.lines.v} ${pkgBase}: `) +
          colors.muted(pkgVersions.join(', ')),
      )
    }
  }
}

const printSourceFiles = (results, topLimit) => {
  const { own, totalSize } = results

  console.log(sectionHeader('Source Files'))

  const topOwn =
    topLimit !== null
      ? own.sort((a, b) => b.bytes - a.bytes).slice(0, topLimit)
      : own.sort((a, b) => b.bytes - a.bytes)
  const maxOwnSize = topOwn.length > 0 ? topOwn[0].bytes : 1

  if (topLimit !== null) {
    console.log('\n' + colors.muted(`Showing top ${topLimit} by size:\n`))
  } else {
    console.log('')
  }
  for (const file of topOwn) {
    const pct =
      totalSize > 0 ? ((file.bytes / totalSize) * 100).toFixed(1) : '0.0'
    const relativePct = (file.bytes / maxOwnSize) * 100
    const bar = progressBar(relativePct, defaults.barWidth, colors.sourceCode)
    const sizeStr = human(file.bytes).padEnd(13)
    const pctStr = `${pct}%`.padEnd(6)
    const cleanPath = simplifyPath(file.path)
    console.log(
      `  ${bar} ${chalk.white(sizeStr)} ${colors.sourceCode(pctStr)} ${colors.muted(cleanPath)}`,
    )
  }
}

const printFileBreakdown = (results) => {
  const { tabbyDistVersion, zipEntriesMap, allNames, displayVersions } = results

  if (!tabbyDistVersion || !zipEntriesMap[tabbyDistVersion]) return

  console.log(sectionHeader('File Breakdown'))

  const totalsByVersion = { dist: 0 }
  for (const ver of displayVersions) totalsByVersion[ver] = 0

  // Calculate totals
  for (const name of allNames) {
    if (zipEntriesMap[tabbyDistVersion]?.[name] != null) {
      totalsByVersion.dist += zipEntriesMap[tabbyDistVersion][name]
    }
  }

  const pageBreakdown = new Map()
  const packageBreakdown = new Map()

  for (const [name, size] of Object.entries(zipEntriesMap[tabbyDistVersion])) {
    // Determine page (first path segment)
    const parts = name.split('/')
    if (parts.length > 1) {
      const page = parts[0]
      pageBreakdown.set(page, (pageBreakdown.get(page) || 0) + size)
    }

    // Determine package (from packages/ path)
    if (name.startsWith('packages/')) {
      const pkg = parts[1] || 'unknown'
      packageBreakdown.set(pkg, (packageBreakdown.get(pkg) || 0) + size)
    }
  }

  if (pageBreakdown.size > 0) {
    console.log('')
    const sortedPages = [...pageBreakdown.entries()].sort((a, b) => b[1] - a[1])
    const maxPageSize = sortedPages.length > 0 ? sortedPages[0][1] : 1
    for (const [page, size] of sortedPages) {
      const pct =
        totalsByVersion.dist > 0
          ? ((size / totalsByVersion.dist) * 100).toFixed(1)
          : '0.0'
      const relativePct = (size / maxPageSize) * 100
      const bar = progressBar(relativePct, defaults.barWidth, colors.pages)
      console.log(
        `  ${bar} ${human(size).padEnd(13)} ${colors.pages(`${pct}%`.padEnd(6))} ${colors.muted(page)}`,
      )
    }
  }

  if (packageBreakdown.size > 0) {
    console.log('\n' + subHeader('By Package'))
    const sortedPackages = [...packageBreakdown.entries()].sort(
      (a, b) => b[1] - a[1],
    )
    const maxPkgSize = sortedPackages.length > 0 ? sortedPackages[0][1] : 1
    for (const [pkg, size] of sortedPackages) {
      const pct =
        totalsByVersion.dist > 0
          ? ((size / totalsByVersion.dist) * 100).toFixed(1)
          : '0.0'
      const relativePct = (size / maxPkgSize) * 100
      const bar = progressBar(relativePct, 25, colors.success)
      console.log(
        `  ${bar} ${human(size).padEnd(12)} ${pct.padStart(5)}%  ${colors.muted(pkg)}`,
      )
    }
  }
}

const printWorkspaceDependencies = async (results) => {
  const { workspacePackages, layers, issues, cssImports, unusedDeps } = results

  console.log(sectionHeader('Workspace Dependencies'))

  // Reorganize layers: ROOT layer, APP layer, PAGES layer, then package layers
  const reorganizedLayers = []
  const rootLayer = []
  const appLayer = []
  const pagesLayer = []
  const packageLayers = []

  for (const layer of layers) {
    const roots = layer.filter(
      (pkg) => workspacePackages.get(pkg)?.type === 'root',
    )
    const apps = layer.filter(
      (pkg) => workspacePackages.get(pkg)?.type === 'app',
    )
    const pages = layer.filter(
      (pkg) => workspacePackages.get(pkg)?.type === 'page',
    )
    const packages = layer.filter((pkg) => {
      const type = workspacePackages.get(pkg)?.type
      return type !== 'root' && type !== 'app' && type !== 'page'
    })

    if (roots.length > 0) rootLayer.push(...roots)
    if (apps.length > 0) appLayer.push(...apps)
    if (pages.length > 0) pagesLayer.push(...pages)
    if (packages.length > 0) packageLayers.push(packages)
  }

  // Build final layer order
  if (rootLayer.length > 0) reorganizedLayers.push(rootLayer)
  if (appLayer.length > 0) reorganizedLayers.push(appLayer)
  if (pagesLayer.length > 0) reorganizedLayers.push(pagesLayer)
  for (let i = packageLayers.length - 1; i >= 0; i--) {
    reorganizedLayers.push(packageLayers[i])
  }

  // Create visual dependency graph
  console.log('\n' + colors.muted('  Dependency Graph:'))
  console.log(colors.muted('  ' + chars.lines.h.repeat(80)))

  const box = {
    v: '│',
    down: '▼',
  }

  // Render layers
  for (let layerIdx = 0; layerIdx < reorganizedLayers.length; layerIdx++) {
    const layer = reorganizedLayers[layerIdx]
    const isLastLayer = layerIdx === reorganizedLayers.length - 1

    const rootPackages = layer.filter(
      (pkg) => workspacePackages.get(pkg)?.type === 'root',
    )
    const appPackages = layer.filter(
      (pkg) => workspacePackages.get(pkg)?.type === 'app',
    )
    const pagePackages = layer.filter(
      (pkg) => workspacePackages.get(pkg)?.type === 'page',
    )

    // Determine layer label
    let layerLabel
    if (rootPackages.length > 0) {
      layerLabel = packageRegistry.typeById.root.label
    } else if (appPackages.length > 0) {
      layerLabel = packageRegistry.typeById.app.label
    } else if (pagePackages.length > 0) {
      layerLabel = packageRegistry.typeById.page.label
    } else {
      const offsetLayers =
        (rootLayer.length > 0 ? 1 : 0) + (appLayer.length > 0 ? 1 : 0)
      layerLabel = `P${layerIdx - offsetLayers - 1}`
    }

    const formatPkg = (pkg) => {
      const info = workspacePackages.get(pkg)
      return (info?.color || colors.sourceCode)(
        packageRegistry.byName.get(pkg).displayName,
      )
    }

    const allPkgs = [...layer].sort()
    const pkgStr = allPkgs.map(formatPkg).join(colors.muted('  '))

    const firstPkgType =
      rootPackages.length > 0
        ? 'root'
        : appPackages.length > 0
          ? 'app'
          : pagePackages.length > 0
            ? 'page'
            : 'package'
    const labelColor = getPackageColor(firstPkgType)
    console.log(
      `  ${labelColor(layerLabel.padStart(6))} ${colors.muted(box.v)} ${pkgStr}`,
    )

    if (!isLastLayer) {
      const nextLayer = reorganizedLayers[layerIdx + 1]
      let hasConnections = false

      for (const pkg of layer) {
        const pkgInfo = workspacePackages.get(pkg)
        if (!pkgInfo) continue
        for (const dep of pkgInfo.dependencies) {
          if (nextLayer.includes(dep)) {
            hasConnections = true
            break
          }
        }
        if (hasConnections) break
      }

      if (hasConnections) {
        console.log(colors.muted(`         ${box.v}   ${box.down}`))
      }
    }
  }

  console.log(colors.muted('  ' + chars.lines.h.repeat(80)))

  // Dependency analysis
  const duplicateVersions = detectDuplicateVersions()

  const unusedByPackage = new Map()
  for (const { package: pkg, dependency } of unusedDeps) {
    if (!unusedByPackage.has(pkg)) {
      unusedByPackage.set(pkg, new Set())
    }
    unusedByPackage.get(pkg).add(dependency)
  }

  // Package dependencies list
  console.log('\n' + colors.muted('  Package Dependencies:'))

  const pkgNameWidth = 20
  const arrowWidth = 3
  const indentWidth = 2 + pkgNameWidth + arrowWidth

  const sortedPackages = sortPackagesByType([...workspacePackages.entries()])

  for (const [pkgName, pkg] of sortedPackages) {
    const workspaceDeps = pkg.dependencies
    const npmDepsArray = pkg.npmDependencies

    if (workspaceDeps.length === 0 && npmDepsArray.length === 0) continue

    const nameColor = pkg.color
    const unusedSet = unusedByPackage.get(pkgName) || new Set()
    const depsLines = formatDependencyList({
      workspaceDeps,
      npmDeps: npmDepsArray,
      unusedSet,
      packageLookup: workspacePackages,
      indentWidth,
    })

    console.log(
      `  ${nameColor(pkg.displayName.padEnd(pkgNameWidth))} ${colors.muted('→')} ${depsLines[0]}`,
    )

    for (let lineIdx = 1; lineIdx < depsLines.length; lineIdx++) {
      console.log(''.padStart(indentWidth) + depsLines[lineIdx])
    }
  }

  // Circular dependencies
  const cycles = detectCircularDependencies(workspacePackages)
  if (cycles.length > 0) {
    console.log('\n' + colors.error('⚠ Circular Dependencies Detected:'))
    for (const cycle of cycles) {
      const cycleStr = cycle
        .map((pkg, idx) =>
          idx === cycle.length - 1 ? colors.error(pkg) : colors.warning(pkg),
        )
        .join(colors.error(' → '))
      console.log(colors.error(`  ${chars.lines.v} `) + cycleStr)
    }
  } else {
    console.log('\n' + colors.success('✓ No circular dependencies'))
  }

  // Duplicate versions
  if (duplicateVersions.size > 0) {
    console.log('\n' + colors.warning('⚠ Duplicate Package Versions:'))
    console.log(
      colors.muted(
        '  (same npm package declared with different versions across workspace)',
      ),
    )
    const sortedDuplicates = [...duplicateVersions.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    for (const [depName, usages] of sortedDuplicates) {
      console.log(colors.muted('  │ ') + colors.accent(depName))
      const versionGroups = new Map()
      for (const usage of usages) {
        if (!versionGroups.has(usage.version)) {
          versionGroups.set(usage.version, [])
        }
        versionGroups.get(usage.version).push(usage.package)
      }
      for (const [version, packages] of versionGroups) {
        const pkgList = packages
          .sort()
          .map((pkg) => {
            const info = workspacePackages.get(pkg)
            return (info?.color || colors.sourceCode)(pkg)
          })
          .join(colors.muted(', '))
        console.log(
          colors.muted('    └ ') + colors.muted(version + ': ') + pkgList,
        )
      }
    }
  }

  // Undeclared imports
  if (issues.length > 0) {
    console.log('\n' + colors.warning('⚠ Undeclared Import Dependencies:'))
    console.log(
      colors.muted(
        '  (imports found in code but not declared in package.json)',
      ),
    )
    for (const issue of issues) {
      const pkgInfo = workspacePackages.get(issue.package)
      if (pkgInfo.type === 'root') continue
      const pkgColor = pkgInfo?.color || colors.sourceCode
      console.log(
        colors.warning(`  ${chars.lines.v} `) +
          pkgColor(pkgInfo?.displayName || issue.package) +
          colors.muted(' imports ') +
          colors.dependencies(issue.imports) +
          colors.muted(
            ` (${issue.files.length} file${issue.files.length > 1 ? 's' : ''})`,
          ),
      )
      if (issue.files.length > 0) {
        console.log(colors.muted(`    └ ${issue.files[0]}`))
      }
    }
  } else {
    console.log(
      '\n' + colors.success('✓ All imports properly declared in package.json'),
    )
  }

  // Unused dependencies
  if (unusedDeps.length > 0) {
    console.log('\n' + colors.error('⚠ Unused Dependencies:'))
    console.log(
      colors.muted('  (declared in package.json but not imported in code)'),
    )

    const unusedByPkg = new Map()
    for (const { package: pkg, dependency } of unusedDeps) {
      if (!unusedByPkg.has(pkg)) {
        unusedByPkg.set(pkg, [])
      }
      unusedByPkg.get(pkg).push(dependency)
    }

    const entriesWithPkgInfo = [...unusedByPkg.keys()].map((name) => [
      name,
      workspacePackages.get(name),
    ])
    const sortedNames = sortPackagesByType(entriesWithPkgInfo).map(
      ([name]) => name,
    )

    for (const pkg of sortedNames) {
      const deps = unusedByPkg.get(pkg)
      const pkgInfo = workspacePackages.get(pkg)
      const nameColor = pkgInfo?.color || colors.sourceCode

      const depsStr = deps
        .sort()
        .map((depName) => colors.error(depName))
        .join(colors.muted(', '))
      console.log(
        colors.error(`  ${chars.lines.v} `) +
          nameColor(pkg) +
          colors.muted(' declares ') +
          depsStr +
          colors.muted(` (${deps.length} unused)`),
      )
    }
  } else {
    console.log('\n' + colors.success('✓ No unused dependencies'))
  }

  // CSS cross-package imports
  if (cssImports.length > 0) {
    console.log('\n' + colors.muted('  CSS Cross-Package Imports:'))
    for (const imp of cssImports) {
      const fromInfo = workspacePackages.get(imp.from)
      const fromColor = fromInfo?.color || colors.sourceCode
      console.log(
        colors.muted(`  ${chars.lines.v} `) +
          fromColor(imp.from) +
          colors.muted(' @imports ') +
          colors.dependencies(imp.to) +
          colors.muted(` in ${imp.file}`),
      )
    }
  }

  // Reverse dependencies
  showProgress('Checking for reverse dependencies...')
  const reverseDeps = await detectReverseDependencies(workspacePackages)
  clearProgress()

  if (reverseDeps.length > 0) {
    console.log('\n' + colors.error('⚠ Potential Reverse Dependency Issues:'))
    console.log(
      colors.muted(
        '  (package uses resources defined in a package that depends on it)',
      ),
    )
    for (const issue of reverseDeps) {
      console.log(
        colors.error(`  ${chars.lines.v} `) +
          colors.warning(issue.dependent) +
          colors.muted(' uses CSS vars from ') +
          colors.sourceCode(issue.dependency) +
          colors.muted(
            ` (${issue.vars.length} var${issue.vars.length > 1 ? 's' : ''})`,
          ),
      )
      const exampleVars = issue.vars
        .slice(0, 3)
        .map((varName) => `--${varName}`)
        .join(', ')
      const moreCount = issue.vars.length - 3
      console.log(
        colors.muted(`    └ `) +
          colors.border(exampleVars) +
          (moreCount > 0 ? colors.muted(` +${moreCount} more`) : ''),
      )
    }
  }
}

const printAssetDetails = (results) => {
  const {
    displayVersions,
    zipIndex,
    zipEntriesMap,
    nameMeta,
    tabbyDistVersion,
  } = results

  console.log(sectionHeader('Asset Details'))

  const nameColW = 40
  const gapW = 2
  const sizeColW = 7
  const unitColW = 3
  const trendColW = 2

  const sizeUnitsAligned = (size, unit) => {
    return size.padStart(sizeColW) + ' ' + unit.padEnd(unitColW - 1)
  }

  const humanPartsAligned = (bytes) => {
    const parts = humanParts(bytes)
    return sizeUnitsAligned(parts.value, parts.unit)
  }

  const totalWidth =
    nameColW +
    gapW +
    sizeColW +
    unitColW +
    trendColW +
    displayVersions.length * (gapW + sizeColW + unitColW)

  const gap = ''.padStart(gapW)
  const tableLine = colors.border(chars.lines.h.repeat(totalWidth))

  const header = [
    chalk.bold('Name'.padEnd(nameColW)),
    chalk.bold(
      'dist'
        .padStart(sizeColW + unitColW)
        .padEnd(sizeColW + unitColW + trendColW),
    ),
    ...displayVersions.map((version) =>
      chalk.bold(version.padStart(sizeColW + unitColW)),
    ),
  ].join(gap)
  console.log('\n' + header)
  console.log(tableLine)

  const totalsByVersion = { dist: 0 }
  for (const ver of displayVersions) totalsByVersion[ver] = 0

  for (const row of nameMeta) {
    const name = row.name

    let displayName = name
    if (name.length > nameColW) {
      displayName = '…' + name.slice(-(nameColW - 1))
    }

    let distBytes = 0
    if (zipEntriesMap[tabbyDistVersion]?.[name] != null) {
      distBytes = zipEntriesMap[tabbyDistVersion][name]
      totalsByVersion.dist += distBytes
    }

    let trend = ' '
    if (displayVersions.length > 0 && distBytes > 0) {
      const prevVersion = displayVersions[0]
      const prevBytes = zipEntriesMap[prevVersion]?.[name] || 0
      if (prevBytes > 0) {
        const delta = distBytes - prevBytes
        if (delta > 0) trend = colors.error(chars.trend.up.padStart(trendColW))
        else if (delta < 0)
          trend = colors.success(chars.trend.down.padStart(trendColW))
        else trend = colors.muted(chars.trend.same.padStart(trendColW))
      }
    }

    const distBytesStr = distBytes
      ? colors.accent(humanPartsAligned(distBytes)) + trend
      : colors.muted(sizeUnitsAligned('-', '-')) + ' '.repeat(trendColW)

    const verCols = displayVersions.map((version) => {
      const bytes = zipEntriesMap[version]?.[name] ?? 0
      if (bytes) {
        totalsByVersion[version] += bytes
        return chalk.white(humanPartsAligned(bytes))
      }
      return colors.muted(sizeUnitsAligned('-', '-'))
    })

    const nameStr = colors.muted(displayName.padEnd(nameColW))
    console.log([nameStr, distBytesStr].join(gap) + gap + verCols.join(gap))
  }

  // Totals
  const totalsCols = displayVersions.map((version) =>
    chalk.white.bold(humanPartsAligned(totalsByVersion[version])),
  )
  const zippedCols = displayVersions.map((version) =>
    chalk.white.bold(humanPartsAligned(zipIndex[version].actualBytes)),
  )

  console.log(tableLine)
  console.log(
    [
      chalk.bold('TOTAL'.padEnd(nameColW)),
      colors.accent.bold(humanPartsAligned(totalsByVersion.dist)) +
        ' '.repeat(trendColW),
      totalsCols.join(gap),
    ].join(gap),
  )

  const distZippedSize = tabbyDistVersion
    ? zipIndex[tabbyDistVersion].actualBytes
    : 0
  console.log(
    [
      chalk.bold('ZIPPED'.padEnd(nameColW)),
      colors.accent.bold(humanPartsAligned(distZippedSize)) +
        ' '.repeat(trendColW),
      zippedCols.join(gap),
    ].join(gap),
  )
}

const printFooter = () => {
  console.log(
    '\n' +
      colors.muted(chars.lines.h.repeat(40)) +
      '\n' +
      colors.muted('Run ') +
      colors.accent('pnpm measure --help') +
      colors.muted(' for options\n'),
  )
}

const collectAllData = async ({ versionsBack }) => {
  // Ensure we have sourcemaps
  const existingMaps = await fg(['dist/**/*.map'], { onlyFiles: true })
  if (!existingMaps.length) {
    console.log(
      colors.warning('! No sourcemaps found - generating them now...\n'),
    )

    // Clean dist folder first
    showProgress('Cleaning dist folder...')
    try {
      await runCmd('pnpm', ['clean:bundle'], {})
      clearProgress()
      console.log(colors.success('  ✓ Cleaned dist folder'))
    } catch (_e) {
      clearProgress()
      console.log(colors.warning('  ! Warning: failed to clean dist folder'))
    }

    // Build all pages with sourcemaps
    showProgress('Building all pages with sourcemaps...')
    try {
      await runCmd('turbo', ['build'], {
        env: { ...process.env, CLI_CEB_SOURCEMAPS: 'true' },
      })
      clearProgress()
      console.log(colors.success('  ✓ Built all pages'))
    } catch (_e) {
      clearProgress()
      console.log(
        colors.error('  × turbo build failed - sourcemap analysis unavailable'),
      )
    }
    clearProgress()

    // Check sourcemaps
    showProgress('Checking for generated sourcemaps...')
    const mapsAfter = await fg(['dist/**/*.map'], { onlyFiles: true })
    clearProgress()
    if (!mapsAfter.length) {
      console.log(
        colors.error(
          '  × No sourcemaps produced. Run builds with CLI_CEB_SOURCEMAPS=true manually.',
        ),
      )
    } else {
      console.log(colors.success('  ✓ Sourcemaps generated successfully'))
    }
  } else {
    console.log(colors.success('  ✓ Found existing sourcemaps'))
  }

  // Analyze sourcemaps
  showProgress('Analyzing sourcemaps...')
  const jsFiles = await fg(['dist/**/*.js'], { onlyFiles: true })
  const { deps, own, totalMapped } = await analyzeSourcemaps(jsFiles)
  clearProgress()
  console.log(colors.success('  ✓ Sourcemap analysis complete'))

  const { depsBytes, ownBytes, depsPercent, ownPercent } =
    calculateBundleTotals(deps, own, totalMapped)

  // Detect duplicate bundled dependencies
  const actualDuplicates = detectDuplicateBundledDeps(deps)

  // Create tabby-dist.zip
  showProgress('Creating tabby-dist.zip...')
  let zipCreated = false
  try {
    await runCmd('pnpm', ['zip', '--', '-f', 'tabby-dist.zip'])
    clearProgress()
    console.log(colors.success('  ✓ Created tabby-dist.zip'))
    zipCreated = true
  } catch (err) {
    clearProgress()
    console.log(
      colors.warning(
        `  ⚠ Failed to create tabby-dist.zip: ${String(err.message || err)}`,
      ),
    )
    console.log(colors.muted('  (Continuing with dependency analysis...)'))
  }

  // Read zip contents
  showProgress('Reading version zips...')
  const zipContents = await listZipContents()
  clearProgress()
  console.log(colors.success('  ✓ Zip contents read successfully'))

  // Build zip version data
  const {
    versions,
    zipIndex,
    zipEntriesMap,
    allNames,
    nameMeta,
    tabbyDistVersion,
  } = buildZipVersionData(zipContents, versionsBack)

  // Collect workspace packages
  showProgress('Analyzing workspace dependencies...')
  const workspacePackages = await collectWorkspacePackages()
  clearProgress()
  console.log(colors.success('  ✓ Workspace dependencies analyzed'))

  // Analyze imports
  const { issues, cssImports, actualImports, actualNpmImports } =
    await analyzeImportStatements(workspacePackages)

  // Detect unused dependencies
  const unusedDeps = detectUnusedDependencies(
    workspacePackages,
    actualImports,
    actualNpmImports,
  )

  // Build dependency layers
  const layers = buildDependencyLayers(workspacePackages)

  // Calculate derived values
  const totalSize = depsBytes + ownBytes
  const displayVersions = versions.filter(
    (ver) => !String(ver).startsWith('tabby-dist'),
  )
  const { currentUncompressed, currentZipped } = calculateCurrentVersionStats(
    tabbyDistVersion,
    zipContents,
  )
  const sizeCategory = calculateSizeCategory(currentZipped)
  const currentFileCount = tabbyDistVersion
    ? Object.keys(zipEntriesMap[tabbyDistVersion] || {}).length
    : 0

  return {
    // Sourcemap analysis
    deps,
    own,
    totalMapped,
    depsBytes,
    ownBytes,
    depsPercent,
    ownPercent,
    totalSize,
    actualDuplicates,

    // Zip data
    zipContents,
    versions,
    zipIndex,
    zipEntriesMap,
    allNames,
    nameMeta,
    tabbyDistVersion,
    zipCreated,

    // Current version stats
    displayVersions,
    currentUncompressed,
    currentZipped,
    currentFileCount,
    sizeCategory,

    // Workspace analysis
    workspacePackages,
    layers,
    issues,
    cssImports,
    actualImports,
    actualNpmImports,
    unusedDeps,
  }
}

;(async function main() {
  try {
    // Parse CLI arguments
    const argv = process.argv.slice(2)
    const args = parseArguments(argv)

    // Handle help
    if (args.help) {
      showHelp()
      return
    }

    // Show welcome banner
    showWelcome()

    // Collect all analysis data
    const results = await collectAllData({ versionsBack: args.versionsBack })

    // Display all output sections
    printBundleOverview(results)
    printDependencies(results, args.topLimit)
    printSourceFiles(results, args.topLimit)
    printFileBreakdown(results)
    await printWorkspaceDependencies(results)
    printAssetDetails(results)
    printFooter()
  } catch (err) {
    console.error(colors.error('Error:'), err)
    process.exitCode = 2
  }
})()
