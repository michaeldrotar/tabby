import fs from 'fs/promises'
import { statSync, existsSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import fg from 'fast-glob'
import chalk from 'chalk'

// ============================================================================
// CONFIGURATION - Customize colors, defaults, and formatting here
// ============================================================================

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
    if (argv.includes('--help') || argv.includes('-h')) {
      const paletteNames = Object.keys(palettes)
      const exampleColors = palettes.original

      console.log(
        '\n' +
          exampleColors.accent.bold('Tabby Bundle Analyzer') +
          '\n' +
          colors.muted('Analyze bundle sizes, dependencies, and trends') +
          '\n\n' +
          chalk.bold('Usage:') +
          '\n' +
          '  pnpm measure [options]\n\n' +
          chalk.bold('Options:') +
          '\n' +
          '  ' +
          exampleColors.accent('-v, --versions <n>') +
          '         Number of versions to compare (default: ' +
          defaults.versionsBack +
          ')\n' +
          '  ' +
          exampleColors.accent('-t, --top <n>') +
          '              Number of top items to show (default: all)\n' +
          '  ' +
          exampleColors.accent('-c, --color <name>') +
          '         Color palette: ' +
          paletteNames.join(', ') +
          '\n' +
          '                                 (default: original)\n' +
          '  ' +
          exampleColors.accent('-h, --help') +
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

    // Parse color palette argument first (before other args that might use colors)
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '-c' || argv[i] === '--color') {
        const paletteName = argv[i + 1]
        if (paletteName && palettes[paletteName]) {
          colors = palettes[paletteName]
          i++
        } else if (paletteName) {
          console.error(chalk.red(`Unknown color palette: ${paletteName}`))
          console.error(
            chalk.dim(`Available: ${Object.keys(palettes).join(', ')}`),
          )
          process.exit(1)
        }
      }
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
      const pages = []
      try {
        const dirents = await fs.readdir('pages', { withFileTypes: true })
        for (const d of dirents) if (d.isDirectory()) pages.push(d.name)
      } catch (e) {
        // if pages dir is missing, fall back to full build
      }

      for (const p of pages) {
        const pkgPath = path.join('pages', p, 'package.json')
        if (!existsSync(pkgPath)) continue
        try {
          const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
          if (pkg.scripts && pkg.scripts.build) {
            showProgress(`Building ${p} with sourcemaps...`)
            try {
              // run build with CLI_CEB_SOURCEMAPS=true to enable sourcemaps without watch mode
              await runCmd(
                'pnpm',
                ['-C', path.join('pages', p), 'run', 'build'],
                {
                  env: { ...process.env, CLI_CEB_SOURCEMAPS: 'true' },
                },
              )
            } catch (e) {
              clearProgress()
              console.log(
                colors.warning(
                  `  ! Warning: build for ${p} failed (continuing)`,
                ),
              )
            }
          }
        } catch (e) {
          // ignore malformed package.json
        }
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
    try {
      await runCmd('pnpm', ['zip', '--', '-f', 'tabby-dist.zip'])
      clearProgress()
      console.log(colors.success('• Created tabby-dist.zip\n'))
    } catch (e) {
      clearProgress()
      console.error(
        colors.error(
          `× Failed to create tabby-dist.zip: ${String(e.message || e)}`,
        ),
      )
      process.exit(1)
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
    // 5. DETAILED ASSET TABLE
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
