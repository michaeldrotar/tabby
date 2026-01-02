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

const palettes = {
  ocean: {
    // Primary semantic colors
    dependencies: chalk.hex('#0EA5E9'), // Sky blue for dependencies
    sourceCode: chalk.hex('#06B6D4'), // Cyan for source/own code
    pages: chalk.hex('#8B5CF6'), // Violet for pages
    accent: chalk.hex('#38BDF8'), // Light blue accent
    muted: chalk.dim, // Muted/secondary text
    border: chalk.hex('#475569'), // Slate gray borders

    // Status colors (good -> bad gradient)
    success: chalk.hex('#10B981'), // Emerald green
    warning: chalk.hex('#F59E0B'), // Amber
    error: chalk.hex('#EF4444'), // Red

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.hex('#10B981') }, // Emerald
      { name: 'Small', color: chalk.hex('#06B6D4') }, // Cyan
      { name: 'Medium', color: chalk.hex('#F59E0B') }, // Amber
      { name: 'Large', color: chalk.hex('#F97316') }, // Orange
      { name: 'Huge', color: chalk.hex('#EF4444') }, // Red
    ],
  },
  forest: {
    // Primary semantic colors
    dependencies: chalk.hex('#84CC16'), // Lime for dependencies
    sourceCode: chalk.hex('#22C55E'), // Green for source/own code
    pages: chalk.hex('#A78BFA'), // Lavender for pages
    accent: chalk.hex('#4ADE80'), // Light green accent
    muted: chalk.dim, // Muted/secondary text
    border: chalk.hex('#6B7280'), // Cool gray borders

    // Status colors (good -> bad gradient)
    success: chalk.hex('#22C55E'), // Green
    warning: chalk.hex('#EAB308'), // Yellow
    error: chalk.hex('#DC2626'), // Red

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.hex('#22C55E') }, // Green
      { name: 'Small', color: chalk.hex('#84CC16') }, // Lime
      { name: 'Medium', color: chalk.hex('#EAB308') }, // Yellow
      { name: 'Large', color: chalk.hex('#F97316') }, // Orange
      { name: 'Huge', color: chalk.hex('#DC2626') }, // Red
    ],
  },
  neon: {
    // Primary semantic colors
    dependencies: chalk.hex('#FF6B6B'), // Coral for dependencies
    sourceCode: chalk.hex('#4ECDC4'), // Teal for source/own code
    pages: chalk.hex('#FFE66D'), // Yellow for pages
    accent: chalk.hex('#95E1D3'), // Mint accent
    muted: chalk.dim, // Muted/secondary text
    border: chalk.hex('#555555'), // Dark gray borders

    // Status colors (good -> bad gradient)
    success: chalk.hex('#4ECDC4'), // Teal
    warning: chalk.hex('#FFE66D'), // Yellow
    error: chalk.hex('#FF6B6B'), // Coral

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.hex('#4ECDC4') }, // Teal
      { name: 'Small', color: chalk.hex('#95E1D3') }, // Mint
      { name: 'Medium', color: chalk.hex('#FFE66D') }, // Yellow
      { name: 'Large', color: chalk.hex('#F9A826') }, // Gold
      { name: 'Huge', color: chalk.hex('#FF6B6B') }, // Coral
    ],
  },
  original: {
    // Primary semantic colors
    dependencies: chalk.hex('#FF8C00'), // Orange for dependencies
    sourceCode: chalk.hex('#9370DB'), // Purple for source/own code
    pages: chalk.magenta, // Magenta for pages
    accent: chalk.cyan, // Accent color for highlights
    muted: chalk.dim, // Muted/secondary text
    border: chalk.gray, // Borders and lines

    // Status colors (good -> bad gradient)
    success: chalk.green, // Positive changes, success states
    warning: chalk.yellow, // Warnings, neutral-ish changes
    error: chalk.red, // Errors, size increases

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.green }, // 0-100 KB
      { name: 'Small', color: chalk.greenBright }, // 100-500 KB
      { name: 'Medium', color: chalk.yellow }, // 500-1000 KB
      { name: 'Large', color: chalk.hex('#FFA500') }, // 1-2 MB
      { name: 'Huge', color: chalk.red }, // 2+ MB
    ],
  },
  sunset: {
    // Primary semantic colors
    dependencies: chalk.hex('#FF6B35'), // Orange-red for dependencies
    sourceCode: chalk.hex('#004E89'), // Deep blue for source/own code
    pages: chalk.hex('#F77F00'), // Bright orange for pages
    accent: chalk.hex('#00A8E8'), // Sky blue accent
    muted: chalk.dim, // Muted/secondary text
    border: chalk.hex('#6B7280'), // Gray borders

    // Status colors (good -> bad gradient)
    success: chalk.hex('#10B981'), // Green
    warning: chalk.hex('#F59E0B'), // Amber
    error: chalk.hex('#DC2626'), // Red

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.hex('#10B981') }, // Green
      { name: 'Small', color: chalk.hex('#00A8E8') }, // Sky blue
      { name: 'Medium', color: chalk.hex('#F59E0B') }, // Amber
      { name: 'Large', color: chalk.hex('#FF6B35') }, // Orange-red
      { name: 'Huge', color: chalk.hex('#DC2626') }, // Red
    ],
  },
  berry: {
    // Primary semantic colors
    dependencies: chalk.hex('#8B5CF6'), // Violet for dependencies
    sourceCode: chalk.hex('#06B6D4'), // Cyan for source/own code
    pages: chalk.hex('#F97316'), // Orange for pages
    accent: chalk.hex('#FBBF24'), // Yellow accent
    muted: chalk.dim, // Muted/secondary text
    border: chalk.hex('#6B7280'), // Gray borders

    // Status colors (good -> bad gradient)
    success: chalk.hex('#10B981'), // Green
    warning: chalk.hex('#F59E0B'), // Amber
    error: chalk.hex('#EF4444'), // Red

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.hex('#10B981') }, // Green
      { name: 'Small', color: chalk.hex('#06B6D4') }, // Cyan
      { name: 'Medium', color: chalk.hex('#F59E0B') }, // Amber
      { name: 'Large', color: chalk.hex('#F97316') }, // Orange
      { name: 'Huge', color: chalk.hex('#EF4444') }, // Red
    ],
  },
  candy: {
    // Primary semantic colors
    dependencies: chalk.hex('#FF1493'), // Deep pink for dependencies
    sourceCode: chalk.hex('#00CED1'), // Dark turquoise for source/own code
    pages: chalk.hex('#FFD700'), // Gold for pages
    accent: chalk.hex('#FF69B4'), // Hot pink accent
    muted: chalk.dim, // Muted/secondary text
    border: chalk.hex('#696969'), // Dim gray borders

    // Status colors (good -> bad gradient)
    success: chalk.hex('#00FA9A'), // Medium spring green
    warning: chalk.hex('#FFD700'), // Gold
    error: chalk.hex('#FF4500'), // Orange red

    // Size category scale (tiny -> huge)
    scale: [
      { name: 'Tiny', color: chalk.hex('#00FA9A') }, // Spring green
      { name: 'Small', color: chalk.hex('#00CED1') }, // Turquoise
      { name: 'Medium', color: chalk.hex('#FFD700') }, // Gold
      { name: 'Large', color: chalk.hex('#FF8C00') }, // Dark orange
      { name: 'Huge', color: chalk.hex('#FF4500') }, // Orange red
    ],
  },
  midnight: {
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
  },
}

let colors = palettes['midnight']

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

// ============================================================================
// DEPENDENCY ANALYSIS - Package dependency tree and import analysis
// ============================================================================

/**
 * Collects all workspace packages (from packages/ and pages/) and their dependencies
 */
async function collectWorkspacePackages() {
  const packages = new Map()

  // Find all package.json files including root
  const packageJsonPaths = await fg(
    [
      'package.json',
      'packages/*/package.json',
      'pages/*/package.json',
      'chrome-extension/package.json',
    ],
    {
      onlyFiles: true,
    },
  )

  for (const pkgPath of packageJsonPaths) {
    try {
      const pkgContent = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
      const pkgName = pkgContent.name
      const pkgDir = path.dirname(pkgPath)
      const shortName =
        pkgDir === '.' ? 'root' : pkgName.replace('@extension/', '')

      // Extract workspace dependencies (those with workspace:*)
      const allDeps = {
        ...pkgContent.dependencies,
        ...pkgContent.devDependencies,
      }

      const workspaceDeps = Object.entries(allDeps)
        .filter(([_, version]) => version === 'workspace:*')
        .map(([name]) => name.replace('@extension/', ''))

      // Determine type: root is 'root', chrome-extension is 'app', pages/ are 'page', rest are 'package'
      let type = 'package'
      if (pkgDir === '.') {
        type = 'root'
      } else if (pkgDir === 'chrome-extension') {
        type = 'app'
      } else if (pkgDir.startsWith('pages/')) {
        type = 'page'
      }

      packages.set(shortName, {
        name: pkgName,
        shortName,
        dir: pkgDir,
        dependencies: workspaceDeps,
        type,
      })
    } catch (e) {
      // Skip invalid package.json files
    }
  }

  return packages
}

/**
 * Collects npm dependencies from workspace packages
 * Returns a map of package name -> npm dependencies
 */
async function collectNpmDependencies(workspacePackages) {
  const npmDeps = new Map()

  for (const [shortName, pkg] of workspacePackages) {
    const pkgJsonPath = path.join(pkg.dir, 'package.json')
    try {
      const pkgContent = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'))
      const allDeps = {
        ...pkgContent.dependencies,
        ...pkgContent.devDependencies,
      }

      // Filter out workspace dependencies
      const external = Object.entries(allDeps)
        .filter(([_, version]) => version !== 'workspace:*')
        .map(([name, version]) => ({ name, version }))

      if (external.length > 0) {
        npmDeps.set(shortName, external)
      }
    } catch (e) {
      // Skip
    }
  }

  return npmDeps
}

/**
 * Detects duplicate versions of the same npm package across workspace packages
 * Returns Map of package name -> array of {package, version}
 */
async function detectDuplicateVersions(workspacePackages) {
  const npmVersions = new Map() // npm package -> [{workspacePackage, version}]

  for (const [shortName, pkg] of workspacePackages) {
    const pkgJsonPath =
      pkg.dir === '.' ? 'package.json' : path.join(pkg.dir, 'package.json')
    try {
      const pkgContent = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'))
      const allDeps = {
        ...pkgContent.dependencies,
        ...pkgContent.devDependencies,
      }

      for (const [depName, version] of Object.entries(allDeps)) {
        // Skip workspace dependencies
        if (version === 'workspace:*') continue

        if (!npmVersions.has(depName)) {
          npmVersions.set(depName, [])
        }
        npmVersions.get(depName).push({
          package: shortName,
          version: version,
        })
      }
    } catch (e) {
      // Skip
    }
  }

  // Filter to only packages with different versions
  const duplicates = new Map()
  for (const [depName, usages] of npmVersions) {
    const uniqueVersions = new Set(usages.map((u) => u.version))
    if (uniqueVersions.size > 1) {
      duplicates.set(depName, usages)
    }
  }

  return duplicates
}

/**
 * Detects circular dependencies in the package graph using DFS
 */
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

/**
 * Analyzes import statements in source files to find undeclared dependencies
 * Also detects CSS imports and potential reverse dependency issues
 */
async function analyzeImportStatements(packages, npmDeps) {
  const issues = []
  const cssImports = [] // Track CSS imports between packages
  const actualImports = new Map() // Track what each package actually imports
  const actualNpmImports = new Map() // Track npm packages actually used

  for (const [shortName, pkg] of packages) {
    // Get all files in package directory (not just source files)
    // IMPORTANT: Exclude package.json and markdown files to avoid false positives
    // Scan all files except package.json, markdown, and lock files
    const allFiles = await fg([`${pkg.dir}/**/*`], {
      onlyFiles: true,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.map',
        '**/package.json',
        '**/*.md',
        '**/pnpm-lock.yaml',
        '**/package-lock.json',
        '**/yarn.lock',
      ],
    })

    const declaredDeps = new Set(pkg.dependencies)
    const usedDeps = new Set()
    actualImports.set(shortName, usedDeps)

    // Track which npm dependencies are used
    const usedNpmDeps = new Set()
    actualNpmImports.set(shortName, usedNpmDeps)
    const npmDepList = npmDeps.get(shortName) || []
    const npmDepNames = new Set(npmDepList.map((d) => d.name))

    // For each declared workspace dependency, check if its name appears anywhere in any file
    for (const depName of declaredDeps) {
      for (const file of allFiles) {
        try {
          const content = readFileSync(file, 'utf8')
          // Simple check: does the package name appear in the file?
          // This catches imports, extends, requires, config references, etc.
          if (content.includes(`@extension/${depName}`)) {
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

        if (isCssFile) {
          // Match CSS imports: @import '@extension/...' or url('@extension/...')
          const cssImportRegex =
            /@import\s+['"]@extension\/([^/'"\s]+)|url\(['"]@extension\/([^/'"\s]+)/g
          let match
          while ((match = cssImportRegex.exec(content)) !== null) {
            const importedPkg = match[1] || match[2]
            if (importedPkg && importedPkg !== shortName) {
              cssImports.push({
                from: shortName,
                to: importedPkg,
                file: path.relative(process.cwd(), file),
                type: 'css',
              })
            }
          }
        } else {
          // Match JS/TS import statements: import ... from '@extension/...'
          const importRegex =
            /import\s+(?:[\s\S]*?)\s+from\s+['"]@extension\/([^/'"\s]+)/g
          let match

          while ((match = importRegex.exec(content)) !== null) {
            const importedPkg = match[1]
            // Skip if it's importing from itself
            if (importedPkg === shortName) continue

            // Check if this import is declared in package.json
            if (!declaredDeps.has(importedPkg)) {
              issues.push({
                package: shortName,
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

/**
 * Detects unused dependencies - deps declared in package.json but not actually imported
 */
function detectUnusedDependencies(
  packages,
  actualImports,
  npmDeps,
  actualNpmImports,
) {
  const unused = []

  for (const [shortName, pkg] of packages) {
    // Check workspace dependencies
    const declaredDeps = new Set(pkg.dependencies)
    const usedDeps = actualImports.get(shortName) || new Set()

    for (const dep of declaredDeps) {
      if (!usedDeps.has(dep)) {
        unused.push({
          package: shortName,
          dependency: dep,
        })
      }
    }

    // Check npm dependencies
    const npmDepList = npmDeps.get(shortName) || []
    const usedNpmDeps = actualNpmImports.get(shortName) || new Set()

    for (const npmDep of npmDepList) {
      if (!usedNpmDeps.has(npmDep.name)) {
        unused.push({
          package: shortName,
          dependency: npmDep.name,
        })
      }
    }
  }

  return unused
}

/**
 * Detects potential reverse dependency issues (A depends on B, but B references things defined in A)
 * This is common with CSS variables: tailwindcss-config generates config from CSS vars defined in ui
 */
async function detectReverseDependencies(packages) {
  const issues = []

  // Look for CSS variable definitions and usages
  const cssVarDefinitions = new Map() // package -> Set of var names defined
  const cssVarUsages = new Map() // package -> Map of var name -> files

  for (const [shortName, pkg] of packages) {
    const cssFiles = await fg([`${pkg.dir}/**/*.css`], {
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/dist/**'],
    })

    cssVarDefinitions.set(shortName, new Set())
    cssVarUsages.set(shortName, new Map())

    for (const file of cssFiles) {
      try {
        const content = readFileSync(file, 'utf8')

        // Find CSS variable definitions: --variable-name:
        const defRegex = /--([\w-]+)\s*:/g
        let match
        while ((match = defRegex.exec(content)) !== null) {
          cssVarDefinitions.get(shortName).add(match[1])
        }

        // Find CSS variable usages: var(--variable-name)
        const useRegex = /var\(\s*--([\w-]+)/g
        while ((match = useRegex.exec(content)) !== null) {
          const varName = match[1]
          if (!cssVarUsages.get(shortName).has(varName)) {
            cssVarUsages.get(shortName).set(varName, [])
          }
          cssVarUsages
            .get(shortName)
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

/**
 * Builds dependency layers for visualization (topological sort by level)
 */
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

const human = (bytes) => {
  const parts = humanParts(bytes)
  return `${parts.value} ${parts.unit}`
}

const humanParts = (bytes) => {
  const abs = Math.abs(bytes)
  if (abs >= 1024 * 1024 * 1024)
    return { value: (bytes / (1024 * 1024 * 1024)).toFixed(2), unit: 'GB' }
  if (abs >= 1024 * 1024)
    return { value: (bytes / (1024 * 1024)).toFixed(2), unit: 'MB' }
  if (abs >= 1024) return { value: (bytes / 1024).toFixed(2), unit: 'KB' }
  return { value: bytes.toString(), unit: 'B' }
}

// Simplify source file paths for display
const simplifyPath = (p, maxLen = defaults.maxPathLength) => {
  let result = p.replace(/^(?:\.\.\/)+/, '')

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

// Visual elements for CLI
const progressBar = (
  percent,
  width = defaults.barWidth,
  color = colors.accent,
) => {
  const filledWidth = Math.round((percent / 100) * width)
  const emptyWidth = width - filledWidth
  return (
    color(chars.bar.filled.repeat(filledWidth)) +
    colors.border(chars.bar.empty.repeat(emptyWidth))
  )
}

const sectionHeader = (title) => {
  return `\n${chalk.bold.white(title)}\n${colors.muted(chars.lines.h.repeat(title.length + 2))}`
}

const subHeader = (title) => {
  return `\n${colors.muted(chars.lines.tee + chars.lines.h)} ${chalk.bold(title)}`
}

const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let spinnerIndex = 0
const getSpinner = () => spinner[spinnerIndex++ % spinner.length]

const showProgress = (message) => {
  process.stdout.write(
    `\r${chalk.cyan(getSpinner())} ${message}${' '.repeat(20)}`,
  )
}

const clearProgress = () => {
  process.stdout.write('\r' + ' '.repeat(100) + '\r')
}

const runCmd = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts })
    let stdout = ''
    let stderr = ''
    p.stdout.on('data', (d) => (stdout += d.toString()))
    p.stderr.on('data', (d) => (stderr += d.toString()))
    p.on('error', reject)
    p.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else
        reject(new Error(`Command failed: ${cmd} ${args.join(' ')}\n${stderr}`))
    })
  })

async function listZipContents() {
  const zips = await fg(['dist-zip/*.zip'], { onlyFiles: true })
  const results = []
  for (const z of zips) {
    try {
      // Prefer unzip -v for a fast listing
      const { stdout } = await runCmd('unzip', ['-v', z])
      const lines = stdout.split(/\r?\n/)
      const entries = []
      for (const ln of lines) {
        // lines that look like: <spaces><uncompressed> <method> <compressed> ... <name>
        const m = ln.match(
          /^\s*(\d+)\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+(.*)$/,
        )
        if (m) {
          const uncompressed = Number(m[1])
          const compressed = Number(m[2])
          const name = m[3].trim()
          entries.push({ name, uncompressed, compressed })
        }
      }
      entries.sort((a, b) => b.compressed - a.compressed)
      results.push({ zip: z, entries })
    } catch (e) {
      // unzip not available or failed, fallback to just zip file size
      try {
        const st = await fs.stat(z)
        results.push({ zip: z, entries: [], error: e.message, bytes: st.size })
      } catch (e2) {
        results.push({ zip: z, entries: [], error: e.message })
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
          if (
            maybe &&
            ![
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
            ].includes(maybe)
          ) {
            return maybe
          }
        }
      }
      if (
        ![
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
        ].includes(candidate)
      ) {
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
        if (
          /[a-z0-9@_-]+/i.test(name) &&
          ![
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
          ].includes(name)
        )
          return name
      }
    }

    // 3) fallback: look for first package-like segment in path, but avoid repo folders
    const repoBlacklist = new Set([
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
    for (const seg of parts) {
      if (!seg) continue
      const s = stripVersion(seg)
      if (repoBlacklist.has(s)) continue
      // Accept if it looks scoped or hyphenated *or* exists under node_modules
      const looksLikePackage = s.startsWith('@') || s.includes('-')
      const existsInNodeModules =
        existsSync(path.resolve('node_modules', s)) ||
        existsSync(path.resolve('node_modules', s, 'package.json'))
      if ((looksLikePackage || existsInNodeModules) && s.length < 80) return s
    }

    return null
  }

  for (const f of jsFiles) {
    const mapPath = f + '.map'
    if (!existsSync(mapPath)) continue

    // Read and parse the .map file directly — prefer embedded sourcesContent, otherwise resolve
    // source files on disk to estimate sizes.
    let sourcesAcc = {}
    try {
      const mapRaw = await fs.readFile(mapPath, 'utf8')
      let mapJson = null
      try {
        mapJson = JSON.parse(mapRaw)
      } catch (e) {
        mapJson = null
      }

      if (
        !mapJson ||
        !Array.isArray(mapJson.sources) ||
        !mapJson.sources.length
      ) {
        console.log(
          colors.warning(
            `Fallback: .map file has no "sources" array for ${f} (or could not parse .map).`,
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
        (srcLower.includes('/packages/') ||
          srcLower.includes('packages/') ||
          srcLower.includes('/pages/') ||
          srcLower.includes('/src/'))

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

;(async function main() {
  try {
    // Handle --help flag
    const argv = process.argv.slice(2)

    // Parse color palette argument first (before help display)
    let selectedPalette = 'original'
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '-c' || argv[i] === '--color') {
        selectedPalette = argv[i + 1]
        if (selectedPalette && palettes[selectedPalette]) {
          colors = palettes[selectedPalette]
          i++
        } else if (selectedPalette) {
          console.error(chalk.red(`Unknown color palette: ${selectedPalette}`))
          console.error(
            chalk.dim(`Available: ${Object.keys(palettes).join(', ')}`),
          )
          process.exit(1)
        }
      }
    }

    if (argv.includes('--help') || argv.includes('-h')) {
      const paletteNames = Object.keys(palettes)

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
          colors.accent('-c, --color <name>') +
          '         Color palette: ' +
          paletteNames.join(', ') +
          '\n' +
          '                                 (default: original)\n' +
          '  ' +
          colors.accent('-h, --help') +
          '                 Show this help message\n\n' +
          chalk.bold('Examples:') +
          '\n' +
          '  pnpm measure                  Analyze with defaults\n' +
          '  pnpm measure -v 5             Compare last 5 versions\n' +
          '  pnpm measure -t 20            Show top 20 items\n' +
          '  pnpm measure -c sunset        Use sunset color palette\n' +
          '  pnpm measure -c berry -v 3    Berry colors, 3 versions\n',
      )
      return
    }
    // Title
    console.log('\n' + chalk.bold.white('Tabby Bundle Analyzer'))
    console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━') + '\n')

    // Ensure we have sourcemaps: run per-page dev builds (these run `vite build --mode development` and should exit)
    const existingMaps = await fg(['dist/**/*.map'], { onlyFiles: true })
    if (!existingMaps.length) {
      console.log(
        colors.warning('! No sourcemaps found - generating them now...\n'),
      )

      // Clean dist folder first to avoid stale files
      showProgress('Cleaning dist folder...')
      try {
        await runCmd('pnpm', ['clean:bundle'], {})
        clearProgress()
        console.log(colors.success('  ✓ Cleaned dist folder'))
      } catch (e) {
        clearProgress()
        console.log(colors.warning('  ! Warning: failed to clean dist folder'))
      }

      // Build all pages at once using turbo --filter
      showProgress('Building all pages with sourcemaps...')
      try {
        await runCmd(
          'turbo',
          ['build'], //, '--filter=./pages/*'],
          {
            env: { ...process.env, CLI_CEB_SOURCEMAPS: 'true' },
          },
        )
        clearProgress()
        console.log(colors.success('  ✓ Built all pages'))
      } catch (e) {
        clearProgress()
        console.log(
          colors.error(
            '  × turbo build failed - sourcemap analysis unavailable',
          ),
        )
      }
      clearProgress()

      const mapsAfter = await fg(['dist/**/*.map'], { onlyFiles: true })
      if (!mapsAfter.length) {
        console.log(
          colors.error(
            '× No sourcemaps produced. Run builds with CLI_CEB_SOURCEMAPS=true manually.',
          ),
        )
      } else {
        console.log(colors.success('• Sourcemaps generated successfully\n'))
      }
    } else {
      console.log(colors.success('• Found existing sourcemaps\n'))
    }

    // Analyze JS files + sourcemaps
    showProgress('Analyzing sourcemaps...')
    const jsFiles = await fg(['dist/**/*.js'], { onlyFiles: true })
    const { deps, own, totalMapped } = await analyzeSourcemaps(jsFiles)
    clearProgress()
    console.log(colors.success('• Sourcemap analysis complete\n'))

    const depsBytes = deps.reduce((s, d) => s + d.bytes, 0)
    const ownBytes = own.reduce((s, o) => s + o.bytes, 0)
    const depsPercent = totalMapped > 0 ? (depsBytes / totalMapped) * 100 : 0
    const ownPercent = totalMapped > 0 ? (ownBytes / totalMapped) * 100 : 0

    // Detect duplicate dependencies (same base package name with different versions)
    const duplicateDeps = new Map()
    for (const d of deps) {
      const baseName = d.name
        .replace(/@[0-9.]+(_.*)?$/, '')
        .replace(/\+.*$/, '')
      if (!duplicateDeps.has(baseName)) {
        duplicateDeps.set(baseName, [])
      }
      duplicateDeps.get(baseName).push(d.name)
    }
    const actualDuplicates = [...duplicateDeps.entries()].filter(
      ([_, versions]) => versions.length > 1,
    )

    // Create a fresh 'tabby-dist.zip' from the current dist for accurate comparison (overwrite if exists)
    showProgress('Creating tabby-dist.zip...')
    let zipCreated = false
    try {
      await runCmd('pnpm', ['zip', '--', '-f', 'tabby-dist.zip'])
      clearProgress()
      console.log(colors.success('• Created tabby-dist.zip\n'))
      zipCreated = true
    } catch (e) {
      clearProgress()
      console.log(
        colors.warning(
          `⚠ Failed to create tabby-dist.zip: ${String(e.message || e)}`,
        ),
      )
      console.log(colors.muted('  (Continuing with dependency analysis...)\n'))
    }

    // Zips: gather zip metadata (we create tabby-dist.zip above for a direct, packaged comparison)
    showProgress('Reading version zips...')
    const zipContents = await listZipContents()
    clearProgress()

    // Normalize asset names by removing Vite hash suffixes
    const normalizeAssetName = (p) => {
      if (!p) return null
      // ignore source maps
      if (p.endsWith('.map')) return null
      // strip leading dist/ or ./dist/
      p = p.replace(/^\.\/|^\//, '')
      if (p.startsWith('dist/')) p = p.slice('dist/'.length)

      // Remove Vite-style hash segments like '-C70I1Fyf' before the extension
      // Only strip tokens that contain uppercase letters or underscores (heuristic for generated hashes)
      p = p.replace(
        /-(?=(?:.*[A-Z])|(?:.*_))([A-Za-z0-9_-]{6,})(?=\.[^.]+$)/g,
        '',
      )

      return p
    }

    // zip entries: map normalized -> { version -> uncompressed }
    const zipVersions = []
    const zipIndex = {} // version -> { zipPath, mtimeMs, totalUncompressed }
    const zipEntriesMap = {} // version -> normalized -> uncompressed

    for (const z of zipContents) {
      const base = path.basename(z.zip)
      const vMatch = base.match(/-(\d+\.\d+\.\d+)\.zip$/)
      const version = vMatch ? vMatch[1] : base
      zipVersions.push(version)
      try {
        const st = statSync(z.zip)
        zipIndex[version] = {
          zipPath: z.zip,
          mtimeMs: st.mtimeMs,
          totalUncompressed: 0,
          actualBytes: st.size,
        }
      } catch (e) {
        zipIndex[version] = {
          zipPath: z.zip,
          mtimeMs: 0,
          totalUncompressed: 0,
          actualBytes: 0,
        }
      }
      zipEntriesMap[version] = {}
      for (const e of z.entries || []) {
        const norm = normalizeAssetName(e.name)
        if (!norm) continue
        zipEntriesMap[version][norm] = e.uncompressed
        zipIndex[version].totalUncompressed += e.uncompressed || 0
      }
    }

    // Sort zip versions from highest to lowest (semver where possible) and build union of normalized names
    const parseSemver = (v) => {
      const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)$/)
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
    }
    const sortedVersions = [...new Set(zipVersions)].sort((a, b) => {
      const pa = parseSemver(a)
      const pb = parseSemver(b)
      if (pa && pb) {
        for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i]
        return 0
      }
      if (pa && !pb) return -1
      if (!pa && pb) return 1
      return String(b).localeCompare(String(a), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })

    // CLI parsing: allow -v / --versions to limit how many zip versions are shown (default 3)
    // and -t / --top to limit top dependencies and files shown
    // argv is already declared at the top of main()
    let versionsBack = defaults.versionsBack
    let topLimit = defaults.topDeps // null means show all

    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '-v' || argv[i] === '--versions') {
        const val = argv[i + 1]
        const parsed = Number(val)
        if (!Number.isNaN(parsed) && parsed > 0) {
          versionsBack = parsed
          i++
        } else {
          versionsBack = defaults.versionsBack
        }
      }
      if (argv[i] === '-t' || argv[i] === '--top') {
        const val = argv[i + 1]
        const parsed = Number(val)
        if (!Number.isNaN(parsed) && parsed > 0) {
          topLimit = parsed
          i++
        }
      }
    }
    // If a tabby-dist (working) zip exists, ensure it's included and shown first
    const tabbyDistIdx = sortedVersions.findIndex((v) =>
      String(v).startsWith('tabby-dist'),
    )
    let versions = []
    if (tabbyDistIdx !== -1) {
      // Remove tabby-dist from sortedVersions and add it first
      const [tabbyDist] = sortedVersions.splice(tabbyDistIdx, 1)
      versions = [tabbyDist, ...sortedVersions.slice(0, versionsBack)]
    } else {
      versions = sortedVersions.slice(0, versionsBack)
    }

    // Build the union of all asset names from selected versions
    const allNames = new Set(
      versions.flatMap((v) => Object.keys(zipEntriesMap[v] || {})),
    )

    // For ordering: find the most recent (largest) size for each asset across all versions
    const tabbyDistVersion = versions.find((v) =>
      String(v).startsWith('tabby-dist'),
    )
    const nameMeta = [] // { name, recentSize }
    for (const name of allNames) {
      let recentSize = 0
      // Prefer tabby-dist size if available, otherwise use the largest size from any version
      if (
        tabbyDistVersion &&
        zipEntriesMap[tabbyDistVersion] &&
        zipEntriesMap[tabbyDistVersion][name] != null
      ) {
        recentSize = zipEntriesMap[tabbyDistVersion][name]
      } else {
        for (const v of versions) {
          if (zipEntriesMap[v] && zipEntriesMap[v][name] != null) {
            recentSize = Math.max(recentSize, zipEntriesMap[v][name])
          }
        }
      }
      nameMeta.push({ name, recentSize })
    }

    // sort by recentSize descending
    nameMeta.sort((a, b) => b.recentSize - a.recentSize)

    // ========================================
    // BEAUTIFUL OUTPUT WITH LOGICAL ORDERING
    // ========================================

    // Calculate totals
    const totalSize = depsBytes + ownBytes

    // Determine which versions to show (exclude tabby-dist since we'll show it as "dist")
    const displayVersions = versions.filter(
      (v) => !String(v).startsWith('tabby-dist'),
    )

    // Get current version data (tabbyDistVersion is already declared above)
    const currentEntries = tabbyDistVersion
      ? zipContents.find((z) => z.zip.includes('tabby-dist'))?.entries || []
      : []
    const currentUncompressed = currentEntries.reduce(
      (sum, e) => sum + e.uncompressed,
      0,
    )
    const currentZipped = currentEntries.reduce(
      (sum, e) => sum + e.compressed,
      0,
    )

    // Size category with visual scale
    const sizeCategory = (() => {
      const kb = currentZipped / 1024
      // Define category boundaries using colors.scale
      const boundaries = [0, 100, 500, 1000, 2000, 10000]

      // Find which category we're in
      let categoryIndex = colors.scale.length - 1 // default to last (Huge)
      for (let i = 0; i < colors.scale.length; i++) {
        if (kb >= boundaries[i] && kb < boundaries[i + 1]) {
          categoryIndex = i
          break
        }
      }
      const category = colors.scale[categoryIndex]

      // Calculate position within the overall scale (0 to 1)
      const categoryWidth = 1 / colors.scale.length
      const positionWithinCategory =
        (kb - boundaries[categoryIndex]) /
        (boundaries[categoryIndex + 1] - boundaries[categoryIndex])
      const pos =
        categoryIndex * categoryWidth + positionWithinCategory * categoryWidth

      return { name: category.name, color: category.color, pos }
    })()

    // =================
    // 1. BUNDLE OVERVIEW
    // =================
    console.log(sectionHeader('Bundle Overview'))

    // Size category with visual scale - indented to distinguish from heading
    const scaleWidth = defaults.scaleWidth
    const scalePos = Math.floor(sizeCategory.pos * scaleWidth)
    const scaleBefore = chars.scale.line.repeat(scalePos)
    const scaleAfter = chars.scale.line.repeat(scaleWidth - scalePos - 1)
    const scaleBar =
      colors.border(scaleBefore) +
      sizeCategory.color(chars.scale.marker) +
      colors.border(scaleAfter)

    // Build scale labels with proper spacing
    const scaleLabels = colors.scale.map((s) => s.color(s.name))
    const labelSpacing = Math.floor(scaleWidth / colors.scale.length) - 4
    const labelLine = scaleLabels
      .map((l) => l + ' '.repeat(Math.max(2, labelSpacing)))
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
    const currentVersion = versions.find((v) =>
      String(v).startsWith('tabby-dist'),
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

    // Count files in current version
    const currentFileCount = tabbyDistVersion
      ? Object.keys(zipEntriesMap[tabbyDistVersion] || {}).length
      : 0

    // Helper for delta display with proper sign and color
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
      '\n' +
        colors.muted(chars.lines.v) +
        ' ' +
        chalk.bold('Code Composition:'),
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

    // ========================
    // 2. DEPENDENCIES
    // ========================
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
    for (const d of topDeps) {
      const pct =
        totalSize > 0 ? ((d.bytes / totalSize) * 100).toFixed(1) : '0.0'
      const relativePct = (d.bytes / maxDepSize) * 100
      const bar = progressBar(
        relativePct,
        defaults.barWidth,
        colors.dependencies,
      )
      const sizeStr = human(d.bytes).padEnd(13)
      const pctStr = `${pct}%`.padEnd(6)
      console.log(
        `  ${bar} ${chalk.white(sizeStr)} ${colors.dependencies(pctStr)} ${colors.muted(d.name)}`,
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

    // ========================
    // 3. SOURCE FILES
    // ========================
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
    for (const o of topOwn) {
      const pct =
        totalSize > 0 ? ((o.bytes / totalSize) * 100).toFixed(1) : '0.0'
      const relativePct = (o.bytes / maxOwnSize) * 100
      const bar = progressBar(relativePct, defaults.barWidth, colors.sourceCode)
      const sizeStr = human(o.bytes).padEnd(13)
      const pctStr = `${pct}%`.padEnd(6)
      const cleanPath = simplifyPath(o.path)
      console.log(
        `  ${bar} ${chalk.white(sizeStr)} ${colors.sourceCode(pctStr)} ${colors.muted(cleanPath)}`,
      )
    }

    // =====================
    // 4. FILE BREAKDOWN
    // =====================
    if (tabbyDistVersion && zipEntriesMap[tabbyDistVersion]) {
      console.log(sectionHeader('File Breakdown'))

      const totalsByVersion = { dist: 0 }
      for (const v of displayVersions) totalsByVersion[v] = 0

      // Calculate totals
      for (const name of allNames) {
        if (
          tabbyDistVersion &&
          zipEntriesMap[tabbyDistVersion] &&
          zipEntriesMap[tabbyDistVersion][name] != null
        ) {
          totalsByVersion.dist += zipEntriesMap[tabbyDistVersion][name]
        }
      }

      const pageBreakdown = new Map()
      const packageBreakdown = new Map()

      for (const [name, size] of Object.entries(
        zipEntriesMap[tabbyDistVersion],
      )) {
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
        const sortedPages = [...pageBreakdown.entries()].sort(
          (a, b) => b[1] - a[1],
        )
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

    // ======================
    // 5. WORKSPACE DEPENDENCY ANALYSIS
    // ======================
    console.log(sectionHeader('Workspace Dependencies'))

    showProgress('Analyzing workspace dependencies...')
    const workspacePackages = await collectWorkspacePackages()
    clearProgress()

    // Build dependency layers
    const layers = buildDependencyLayers(workspacePackages)

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

    // Build final layer order: ROOT, APP, PAGES, then packages in reverse order (bottom to top)
    if (rootLayer.length > 0) reorganizedLayers.push(rootLayer)
    if (appLayer.length > 0) reorganizedLayers.push(appLayer)
    if (pagesLayer.length > 0) reorganizedLayers.push(pagesLayer)
    // Reverse package layers so dependencies are at the bottom
    for (let i = packageLayers.length - 1; i >= 0; i--) {
      reorganizedLayers.push(packageLayers[i])
    }

    // Create a visual dependency graph
    console.log('\n' + colors.muted('  Dependency Graph:'))
    console.log(colors.muted('  ' + chars.lines.h.repeat(80)))

    // Box drawing characters for the tree
    const box = {
      tl: '┌',
      tr: '┐',
      bl: '└',
      br: '┘',
      h: '─',
      v: '│',
      vr: '├',
      vl: '┤',
      hd: '┬',
      hu: '┴',
      cross: '┼',
      up: '▲',
      down: '▼',
    }

    // Render layers from top (app) to bottom (dependencies)
    for (let layerIdx = 0; layerIdx < reorganizedLayers.length; layerIdx++) {
      const layer = reorganizedLayers[layerIdx]
      const isFirstLayer = layerIdx === 0
      const isLastLayer = layerIdx === reorganizedLayers.length - 1

      // Categorize packages
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
        layerLabel = 'ROOT'
      } else if (appPackages.length > 0) {
        layerLabel = 'APP'
      } else if (pagePackages.length > 0) {
        layerLabel = 'PAGES'
      } else {
        // Count backwards from the pages layer (account for root and app)
        const offsetLayers =
          (rootPackages.length > 0 ? 1 : 0) + (appPackages.length > 0 ? 1 : 0)
        layerLabel = `P${layerIdx - offsetLayers - 1}`
      }

      // Format packages with colors
      const formatPkg = (pkg) => {
        const info = workspacePackages.get(pkg)
        const color =
          info?.type === 'root'
            ? colors.success
            : info?.type === 'app'
              ? colors.success
              : info?.type === 'page'
                ? colors.pages
                : colors.sourceCode
        return color(pkg)
      }

      // Render layer (sorted alphabetically)
      const allPkgs = [...layer].sort()
      const pkgStr = allPkgs.map(formatPkg).join(colors.muted('  '))

      // Add layer label with visual indicator
      const labelColor =
        rootPackages.length > 0
          ? colors.success
          : appPackages.length > 0
            ? colors.success
            : pagePackages.length > 0
              ? colors.pages
              : colors.sourceCode
      console.log(
        `  ${labelColor(layerLabel.padStart(6))} ${colors.muted(box.v)} ${pkgStr}`,
      )

      // Show dependencies going down (from this layer to next)
      if (!isLastLayer) {
        const nextLayer = reorganizedLayers[layerIdx + 1]
        const connections = []

        for (const pkg of layer) {
          const pkgInfo = workspacePackages.get(pkg)
          if (!pkgInfo) continue

          for (const dep of pkgInfo.dependencies) {
            if (nextLayer.includes(dep)) {
              connections.push({ from: pkg, to: dep })
            }
          }
        }

        if (connections.length > 0) {
          // Show arrow indicator pointing down
          console.log(colors.muted(`         ${box.v}   ${box.down}`))
        }
      }
    }

    console.log(colors.muted('  ' + chars.lines.h.repeat(80)))

    // Collect npm dependencies and analyze imports
    showProgress('Analyzing dependencies...')
    const npmDeps = await collectNpmDependencies(workspacePackages)
    const {
      issues: importIssues,
      cssImports,
      actualImports,
      actualNpmImports,
    } = await analyzeImportStatements(workspacePackages, npmDeps)
    const unusedDeps = detectUnusedDependencies(
      workspacePackages,
      actualImports,
      npmDeps,
      actualNpmImports,
    )
    const duplicateVersions = await detectDuplicateVersions(workspacePackages)
    clearProgress()

    // Build map of unused deps per package for coloring
    const unusedByPackage = new Map()
    for (const { package: pkg, dependency } of unusedDeps) {
      if (!unusedByPackage.has(pkg)) {
        unusedByPackage.set(pkg, new Set())
      }
      unusedByPackage.get(pkg).add(dependency)
    }

    // Combined dependency list
    console.log('\n' + colors.muted('  Package Dependencies:'))

    // Helper to format dependency list with wrapping
    const maxLineWidth = 100
    const pkgNameWidth = 20
    const arrowWidth = 3 // ' → '
    const indentWidth = 2 + pkgNameWidth + arrowWidth // '  ' + name + ' → '

    const formatDeps = (workspaceDeps, npmDepsArray, unusedSet) => {
      const allDeps = []

      // Add workspace deps by type
      const apps = workspaceDeps
        .filter((d) => workspacePackages.get(d)?.type === 'app')
        .sort((a, b) => a.localeCompare(b))
      const pages = workspaceDeps
        .filter((d) => workspacePackages.get(d)?.type === 'page')
        .sort((a, b) => a.localeCompare(b))
      const pkgs = workspaceDeps
        .filter((d) => {
          const type = workspacePackages.get(d)?.type
          return type !== 'app' && type !== 'page'
        })
        .sort((a, b) => a.localeCompare(b))
      const npms = npmDepsArray.sort((a, b) => a.name.localeCompare(b.name))

      apps.forEach((d) => allDeps.push({ name: d, color: colors.success }))
      pages.forEach((d) => allDeps.push({ name: d, color: colors.pages }))
      pkgs.forEach((d) => allDeps.push({ name: d, color: (x) => x }))
      npms.forEach((d) => allDeps.push({ name: d.name, color: colors.muted }))

      if (allDeps.length === 0) return [colors.muted('(none)')]

      const lines = []
      let currentLine = []
      let currentLineLength = 0

      for (let i = 0; i < allDeps.length; i++) {
        const dep = allDeps[i]
        const isLast = i === allDeps.length - 1
        const isUnused = unusedSet.has(dep.name)

        // Use error color for unused, otherwise use the dep's color
        const colorFn = isUnused ? colors.error : dep.color
        const depText = colorFn(dep.name) + (isLast ? '' : colors.muted(', '))
        const depLength = dep.name.length + (isLast ? 0 : 2)

        // Check if adding this dep would exceed width
        if (
          currentLine.length > 0 &&
          indentWidth + currentLineLength + depLength > maxLineWidth
        ) {
          // Finish current line and start new one
          lines.push(currentLine.join(''))
          currentLine = [depText]
          currentLineLength = depLength
        } else {
          currentLine.push(depText)
          currentLineLength += depLength
        }
      }

      // Add remaining line
      if (currentLine.length > 0) {
        lines.push(currentLine.join(''))
      }

      return lines
    }

    // Sort packages: root, app, pages (alpha), packages (alpha)
    const sortedPackages = [...workspacePackages.entries()].sort((a, b) => {
      const [aName, aPkg] = a
      const [bName, bPkg] = b

      // Root first
      if (aPkg.type === 'root' && bPkg.type !== 'root') return -1
      if (aPkg.type !== 'root' && bPkg.type === 'root') return 1

      // App second
      if (aPkg.type === 'app' && bPkg.type !== 'app') return -1
      if (aPkg.type !== 'app' && bPkg.type === 'app') return 1

      // Pages third
      if (aPkg.type === 'page' && bPkg.type === 'package') return -1
      if (aPkg.type === 'package' && bPkg.type === 'page') return 1

      // Within same type, alphabetical
      return aName.localeCompare(bName)
    })

    for (const [shortName, pkg] of sortedPackages) {
      const workspaceDeps = pkg.dependencies
      const npmDepsArray = npmDeps.get(shortName) || []

      if (workspaceDeps.length === 0 && npmDepsArray.length === 0) continue

      const nameColor =
        pkg.type === 'root'
          ? colors.success
          : pkg.type === 'app'
            ? colors.success
            : pkg.type === 'page'
              ? colors.pages
              : colors.sourceCode

      const unusedSet = unusedByPackage.get(shortName) || new Set()
      const depsLines = formatDeps(workspaceDeps, npmDepsArray, unusedSet)

      // Print first line with package name
      console.log(
        `  ${nameColor(shortName.padEnd(pkgNameWidth))} ${colors.muted('→')} ${depsLines[0]}`,
      )

      // Print continuation lines with proper indentation
      for (let i = 1; i < depsLines.length; i++) {
        console.log(''.padStart(indentWidth) + depsLines[i])
      }
    }

    // Check for circular dependencies
    const cycles = detectCircularDependencies(workspacePackages)
    if (cycles.length > 0) {
      console.log('\n' + colors.error('⚠ Circular Dependencies Detected:'))
      for (const cycle of cycles) {
        const cycleStr = cycle
          .map((pkg, i) =>
            i === cycle.length - 1 ? colors.error(pkg) : colors.warning(pkg),
          )
          .join(colors.error(' → '))
        console.log(colors.error(`  ${chars.lines.v} `) + cycleStr)
      }
    } else {
      console.log('\n' + colors.success('✓ No circular dependencies'))
    }

    // Show duplicate versions if any
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
        // Group by version
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
              const color =
                info?.type === 'root' || info?.type === 'app'
                  ? colors.success
                  : info?.type === 'page'
                    ? colors.pages
                    : colors.sourceCode
              return color(pkg)
            })
            .join(colors.muted(', '))
          console.log(
            colors.muted('    └ ') + colors.muted(version + ': ') + pkgList,
          )
        }
      }
    }

    if (importIssues.length > 0) {
      console.log('\n' + colors.warning('⚠ Undeclared Import Dependencies:'))
      console.log(
        colors.muted(
          '  (imports found in code but not declared in package.json)',
        ),
      )
      for (const issue of importIssues) {
        const pkgInfo = workspacePackages.get(issue.package)
        const pkgColor =
          pkgInfo?.type === 'root' || pkgInfo?.type === 'app'
            ? colors.success
            : pkgInfo?.type === 'page'
              ? colors.pages
              : colors.sourceCode

        console.log(
          colors.warning(`  ${chars.lines.v} `) +
            pkgColor(issue.package) +
            colors.muted(' imports ') +
            colors.dependencies(issue.imports) +
            colors.muted(
              ` (${issue.files.length} file${issue.files.length > 1 ? 's' : ''})`,
            ),
        )
        // Show first file as example
        if (issue.files.length > 0) {
          console.log(colors.muted(`    └ ${issue.files[0]}`))
        }
      }
    } else {
      console.log(
        '\n' +
          colors.success('✓ All imports properly declared in package.json'),
      )
    }

    // Show unused dependencies
    if (unusedDeps.length > 0) {
      console.log('\n' + colors.error('⚠ Unused Dependencies:'))
      console.log(
        colors.muted('  (declared in package.json but not imported in code)'),
      )

      // Group by package
      const unusedByPkg = new Map()
      for (const { package: pkg, dependency } of unusedDeps) {
        if (!unusedByPkg.has(pkg)) {
          unusedByPkg.set(pkg, [])
        }
        unusedByPkg.get(pkg).push(dependency)
      }

      // Sort by root, app, pages (alpha), packages (alpha)
      const sortedUnused = [...unusedByPkg.entries()].sort((a, b) => {
        const [aName] = a
        const [bName] = b
        const aPkg = workspacePackages.get(aName)
        const bPkg = workspacePackages.get(bName)

        // Root first
        if (aPkg?.type === 'root' && bPkg?.type !== 'root') return -1
        if (aPkg?.type !== 'root' && bPkg?.type === 'root') return 1

        // App second
        if (aPkg?.type === 'app' && bPkg?.type !== 'app') return -1
        if (aPkg?.type !== 'app' && bPkg?.type === 'app') return 1

        // Pages third
        if (aPkg?.type === 'page' && bPkg?.type === 'package') return -1
        if (aPkg?.type === 'package' && bPkg?.type === 'page') return 1

        // Within same type, alphabetical
        return aName.localeCompare(bName)
      })

      for (const [pkg, deps] of sortedUnused) {
        const pkgInfo = workspacePackages.get(pkg)
        const nameColor =
          pkgInfo?.type === 'root' || pkgInfo?.type === 'app'
            ? colors.success
            : pkgInfo?.type === 'page'
              ? colors.pages
              : colors.sourceCode

        const depsStr = deps
          .sort()
          .map((d) => colors.error(d))
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

    // Check for CSS cross-package imports
    if (cssImports.length > 0) {
      console.log('\n' + colors.muted('  CSS Cross-Package Imports:'))
      for (const imp of cssImports) {
        const fromInfo = workspacePackages.get(imp.from)
        const fromColor =
          fromInfo?.type === 'root' || fromInfo?.type === 'app'
            ? colors.success
            : fromInfo?.type === 'page'
              ? colors.pages
              : colors.sourceCode

        console.log(
          colors.muted(`  ${chars.lines.v} `) +
            fromColor(imp.from) +
            colors.muted(' @imports ') +
            colors.dependencies(imp.to) +
            colors.muted(` in ${imp.file}`),
        )
      }
    }

    // Check for reverse dependency issues (e.g., CSS variables defined in one package but used by its dependency)
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
        // Show some example variables
        const exampleVars = issue.vars
          .slice(0, 3)
          .map((v) => `--${v}`)
          .join(', ')
        const moreCount = issue.vars.length - 3
        console.log(
          colors.muted(`    └ `) +
            colors.border(exampleVars) +
            (moreCount > 0 ? colors.muted(` +${moreCount} more`) : ''),
        )
      }
    }

    // ======================
    // 6. DETAILED ASSET TABLE
    // ======================
    console.log(sectionHeader('Asset Details'))

    // column widths - fixed width for name column to prevent wrapping
    const nameColW = 40
    const gapW = 2 // spaces between columns
    const sizeColW = 7 // Width for size (e.g., "419.62")
    const unitColW = 3 // Width for unit (e.g., "MB", "GB")
    const trendColW = 2 // Width for trend indicator

    const sizeUnitsAligned = (size, unit) => {
      return size.padStart(sizeColW) + ' ' + unit.padEnd(unitColW - 1)
    }

    const humanPartsAligned = (bytes) => {
      const parts = humanParts(bytes)
      return sizeUnitsAligned(parts.value, parts.unit)
    }

    // Total table width for separator lines
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
    for (const v of displayVersions) totalsByVersion[v] = 0

    let rowIndex = 0
    for (const row of nameMeta) {
      const name = row.name

      // Truncate name if too long
      let displayName = name
      if (name.length > nameColW) {
        displayName = '…' + name.slice(-(nameColW - 1))
      }

      // For "dist" column, use tabby-dist.zip if available
      let distBytes = 0
      if (
        tabbyDistVersion &&
        zipEntriesMap[tabbyDistVersion] &&
        zipEntriesMap[tabbyDistVersion][name] != null
      ) {
        distBytes = zipEntriesMap[tabbyDistVersion][name]
        totalsByVersion.dist += distBytes
      }

      // Calculate trend indicator vs previous version
      let trend = ' '
      if (displayVersions.length > 0 && distBytes > 0) {
        const prevVersion = displayVersions[0]
        const prevBytes = zipEntriesMap[prevVersion]?.[name] || 0
        if (prevBytes > 0) {
          const delta = distBytes - prevBytes
          if (delta > 0)
            trend = colors.error(chars.trend.up.padStart(trendColW))
          else if (delta < 0)
            trend = colors.success(chars.trend.down.padStart(trendColW))
          else trend = colors.muted(chars.trend.same.padStart(trendColW))
        }
      }

      const distBytesStr = distBytes
        ? colors.accent(humanPartsAligned(distBytes)) + trend
        : colors.muted(sizeUnitsAligned('-', '-')) + ' '.repeat(trendColW)

      const verCols = displayVersions.map((version) => {
        const bytes =
          zipEntriesMap[version] && zipEntriesMap[version][name] != null
            ? zipEntriesMap[version][name]
            : 0
        if (bytes) {
          totalsByVersion[version] += bytes
          return chalk.white(humanPartsAligned(bytes))
        }
        return colors.muted(sizeUnitsAligned('-', '-'))
      })

      // Zebra striping - use slightly dimmer text for even rows
      const nameStr = colors.muted(displayName.padEnd(nameColW))
      console.log([nameStr, distBytesStr].join(gap) + gap + verCols.join(gap))
      rowIndex++
    }

    // Compute totals and zipped sizes
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

    console.log(
      '\n' +
        colors.muted(chars.lines.h.repeat(40)) +
        '\n' +
        colors.muted('Run ') +
        colors.accent('pnpm measure --help') +
        colors.muted(' for options\n'),
    )
  } catch (err) {
    console.error(colors.error('Error:'), err)
    process.exitCode = 2
  }
})()
