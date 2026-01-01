import fs from 'fs/promises'
import { statSync, existsSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import fg from 'fast-glob'
import chalk from 'chalk'

const human = (bytes) => {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${bytes} B`
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
          chalk.yellow(
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
          chalk.yellow(
            `Fallback parsing of ${mapPath} produced no source sizes.`,
          ),
        )
        continue
      }
    } catch (e) {
      console.log(
        chalk.yellow(`Failed reading/parsing ${mapPath}: ${String(e)}`),
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

  const deps = [...perPackage.entries()]
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
  const own = [...perOwn.entries()]
    .map(([path, bytes]) => ({ path, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
  return { deps, own, totalMapped }
}

;(async function main() {
  try {
    // Ensure we have sourcemaps: run per-page dev builds (these run `vite build --mode development` and should exit)
    const existingMaps = await fg(['dist/**/*.map'], { onlyFiles: true })
    if (!existingMaps.length) {
      console.log(
        chalk.blue(
          'No .map files found in dist — running per-page dev builds to generate sourcemaps...',
        ),
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
            console.log(
              chalk.gray(`  • building page: pages/${p} (with sourcemaps)`),
            )
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
              console.log(
                chalk.yellow(
                  `    Warning: build for pages/${p} failed (continuing): ${String(
                    e.message || e,
                  )}`,
                ),
              )
            }
          }
        } catch (e) {
          // ignore malformed package.json
        }
      }

      const mapsAfter = await fg(['dist/**/*.map'], { onlyFiles: true })
      if (!mapsAfter.length) {
        console.log(
          chalk.red(
            'No sourcemaps produced by per-page builds. You may need to run builds with CLI_CEB_SOURCEMAPS=true manually.',
          ),
        )
      } else {
        console.log(
          chalk.green('Sourcemaps produced. Proceeding with analysis.'),
        )
      }
    } else {
      console.log(
        chalk.green('Found existing .map files — skipping dev builds.'),
      )
    }

    // Analyze JS files + sourcemaps
    const jsFiles = await fg(['dist/**/*.js'], { onlyFiles: true })
    console.log(
      '\n' + chalk.bold.underline('Sourcemap analysis (from .map files only):'),
    )
    const { deps, own, totalMapped } = await analyzeSourcemaps(jsFiles)

    const depsBytes = deps.reduce((s, d) => s + d.bytes, 0)
    const ownBytes = own.reduce((s, o) => s + o.bytes, 0)
    const depsPercent = totalMapped > 0 ? (depsBytes / totalMapped) * 100 : 0
    const ownPercent = totalMapped > 0 ? (ownBytes / totalMapped) * 100 : 0

    console.log(
      `${chalk.bold('Mapped bytes:')} ${human(totalMapped)}  ${chalk.dim('(sum of sources from sourcemaps)')}`,
    )
    console.log(
      `${chalk.green('Dependencies:')} ${human(depsBytes)} (${depsPercent.toFixed(1)}%)  ${chalk.magenta('Own code:')} ${human(ownBytes)} (${ownPercent.toFixed(1)}%)\n`,
    )

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

    if (actualDuplicates.length > 0) {
      console.log(chalk.red.bold('⚠ Duplicate dependencies detected:'))
      for (const [baseName, versions] of actualDuplicates) {
        console.log(`  ${chalk.yellow(baseName)}: ${versions.join(', ')}`)
      }
      console.log()
    }

    if (deps.length) {
      console.log(chalk.bold.underline('All dependencies (by mapped size):'))
      for (const d of deps) {
        const pct =
          totalMapped > 0 ? ((d.bytes / totalMapped) * 100).toFixed(1) : '0.0'
        console.log(
          `${chalk.yellow(human(d.bytes)).padEnd(13)} ${pct.padStart(5)}%  ${d.name}`,
        )
      }
    } else {
      console.log(
        chalk.dim(
          'No dependencies found via sourcemaps (are sourcemaps present?)',
        ),
      )
    }

    if (own.length) {
      console.log(
        '\n' + chalk.bold.underline('All own source files (by mapped size):'),
      )
      for (const o of own) {
        const pct =
          totalMapped > 0 ? ((o.bytes / totalMapped) * 100).toFixed(1) : '0.0'
        // Clean up path to start from project root
        let cleanPath = o.path.replace(/^\.\.\/\.\.\/\.\.\//g, '')
        console.log(
          `${chalk.yellow(human(o.bytes)).padEnd(13)} ${pct.padStart(5)}%  ${cleanPath}`,
        )
      }
    }

    // Create a fresh 'tabby-dist.zip' from the current dist for accurate comparison (overwrite if exists)
    try {
      await runCmd('pnpm', ['zip', '--', '-f', 'tabby-dist.zip'])
    } catch (e) {
      console.error(
        chalk.red(
          `Error: failed to create tabby-dist.zip: ${String(e.message || e)}`,
        ),
      )
      process.exit(1)
    }

    // Zips: gather zip metadata (we create tabby-dist.zip above for a direct, packaged comparison)
    const zipContents = await listZipContents()

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

    // CLI parsing: allow -v / --versions-back to limit how many zip versions are shown (default 3)
    const argv = process.argv.slice(2)
    let versionsBack = 3

    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '-v' || argv[i] === '--versions-back') {
        const val = argv[i + 1]
        const parsed = Number(val)
        if (!Number.isNaN(parsed) && parsed > 0) {
          versionsBack = parsed
          i++
        } else {
          versionsBack = 3
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

    // column widths
    const nameColW = Math.max(20, ...Array.from(allNames).map((n) => n.length))
    const verColW = 14

    // Determine which versions to show as columns (exclude tabby-dist since we'll show it as "dist")
    const displayVersions = versions.filter(
      (v) => !String(v).startsWith('tabby-dist'),
    )

    const header = [
      'Name'.padEnd(nameColW),
      'dist'.padStart(verColW),
      ...displayVersions.map((v) => v.padStart(verColW)),
    ]
    console.log('\n')
    console.log(chalk.bold(header.join('  ')))

    const totalsByVersion = { dist: 0 }
    for (const v of displayVersions) totalsByVersion[v] = 0

    for (const row of nameMeta) {
      const name = row.name

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
      const distBytesStr = distBytes
        ? human(distBytes).padStart(verColW)
        : ''.padStart(verColW)

      const verCols = displayVersions.map((v) => {
        const b =
          zipEntriesMap[v] && zipEntriesMap[v][name] != null
            ? zipEntriesMap[v][name]
            : 0
        if (b) {
          totalsByVersion[v] += b
          return human(b).padStart(verColW)
        }
        return ''.padStart(verColW)
      })

      console.log(
        `${name.padEnd(nameColW)}  ${distBytesStr}  ${verCols.join('  ')}`,
      )
    }

    // Compute totals and zipped sizes
    const totalsCols = displayVersions.map((v) =>
      human(totalsByVersion[v]).padStart(verColW),
    )
    const zippedCols = displayVersions.map((v) =>
      human(zipIndex[v].actualBytes).padStart(verColW),
    )

    console.log(
      '-'.repeat(nameColW + verColW + displayVersions.length * (verColW + 2)),
    )
    console.log(
      `${'TOTAL'.padEnd(nameColW)}  ${human(totalsByVersion.dist).padStart(verColW)}  ${totalsCols.join('  ')}`,
    )

    const distZippedSize = tabbyDistVersion
      ? zipIndex[tabbyDistVersion].actualBytes
      : 0
    console.log(
      `${'ZIPPED'.padEnd(nameColW)}  ${human(distZippedSize).padStart(verColW)}  ${zippedCols.join('  ')}`,
    )

    // Additional insights
    console.log('\n' + chalk.bold.underline('Bundle Insights:'))

    // Size category
    const categories = [
      { name: 'Tiny', max: 500 * 1024 },
      { name: 'Small', max: 1024 * 1024 },
      { name: 'Medium', max: 3 * 1024 * 1024 },
      { name: 'Large', max: 5 * 1024 * 1024 },
      { name: 'Huge', max: Infinity },
    ]
    const category =
      categories.find((c) => distZippedSize <= c.max)?.name || 'Huge'
    console.log(
      `${chalk.bold('Size category:')} ${category} (${human(distZippedSize)} zipped)`,
    )

    // Version delta (compare dist to most recent versioned build)
    if (tabbyDistVersion && displayVersions.length > 0) {
      const compareVersion = displayVersions[0]
      const distTotal = totalsByVersion.dist
      const compareTotal = totalsByVersion[compareVersion]
      const distZipped = distZippedSize
      const compareZipped = zipIndex[compareVersion].actualBytes

      const uncompressedDelta = distTotal - compareTotal
      const uncompressedDeltaPct =
        compareTotal > 0 ? (uncompressedDelta / compareTotal) * 100 : 0
      const zippedDelta = distZipped - compareZipped
      const zippedDeltaPct =
        compareZipped > 0 ? (zippedDelta / compareZipped) * 100 : 0

      const uncompressedColor =
        uncompressedDelta > 0
          ? chalk.red
          : uncompressedDelta < 0
            ? chalk.green
            : chalk.gray
      const zippedColor =
        zippedDelta > 0 ? chalk.red : zippedDelta < 0 ? chalk.green : chalk.gray
      const uncompressedSign = uncompressedDelta > 0 ? '+' : ''
      const zippedSign = zippedDelta > 0 ? '+' : ''

      console.log(`\n${chalk.bold('Changes since ' + compareVersion + ':')}`)
      console.log(
        `  Uncompressed: ${uncompressedColor(uncompressedSign + human(uncompressedDelta))} (${uncompressedColor(uncompressedSign + uncompressedDeltaPct.toFixed(1) + '%')})`,
      )
      console.log(
        `  Zipped: ${zippedColor(zippedSign + human(zippedDelta))} (${zippedColor(zippedSign + zippedDeltaPct.toFixed(1) + '%')})`,
      )

      // New and removed files
      const distFiles = new Set(
        Object.keys(zipEntriesMap[tabbyDistVersion] || {}),
      )
      const compareFiles = new Set(
        Object.keys(zipEntriesMap[compareVersion] || {}),
      )
      const newFiles = [...distFiles].filter((f) => !compareFiles.has(f))
      const removedFiles = [...compareFiles].filter((f) => !distFiles.has(f))

      if (newFiles.length > 0) {
        console.log(`  ${chalk.green('New files:')} ${newFiles.join(', ')}`)
      }
      if (removedFiles.length > 0) {
        console.log(
          `  ${chalk.red('Removed files:')} ${removedFiles.join(', ')}`,
        )
      }
    }

    // Per-page breakdown
    if (tabbyDistVersion && zipEntriesMap[tabbyDistVersion]) {
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
        console.log(`\n${chalk.bold('Per-page breakdown:')}`)
        const sortedPages = [...pageBreakdown.entries()].sort(
          (a, b) => b[1] - a[1],
        )
        for (const [page, size] of sortedPages) {
          const pct =
            totalsByVersion.dist > 0
              ? ((size / totalsByVersion.dist) * 100).toFixed(1)
              : '0.0'
          console.log(
            `  ${page.padEnd(20)} ${human(size).padStart(12)}  ${pct.padStart(5)}%`,
          )
        }
      }

      if (packageBreakdown.size > 0) {
        console.log(`\n${chalk.bold('Per-package breakdown:')}`)
        const sortedPackages = [...packageBreakdown.entries()].sort(
          (a, b) => b[1] - a[1],
        )
        for (const [pkg, size] of sortedPackages) {
          const pct =
            totalsByVersion.dist > 0
              ? ((size / totalsByVersion.dist) * 100).toFixed(1)
              : '0.0'
          console.log(
            `  ${pkg.padEnd(20)} ${human(size).padStart(12)}  ${pct.padStart(5)}%`,
          )
        }
      }
    }

    console.log('\n' + chalk.bold.green('Done.'))
  } catch (err) {
    console.error(chalk.red('Error:'), err)
    process.exitCode = 2
  }
})()
