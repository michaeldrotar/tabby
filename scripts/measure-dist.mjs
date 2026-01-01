import fs from 'fs/promises'
import { statSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import fg from 'fast-glob'
import chalk from 'chalk'
import zlib from 'zlib'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

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

async function listDistFiles() {
  const files = await fg(['dist/**'], { onlyFiles: true })
  const info = []
  for (const f of files) {
    try {
      const st = await fs.stat(f)
      info.push({ path: f, bytes: st.size })
    } catch (e) {
      // ignore
    }
  }
  info.sort((a, b) => b.bytes - a.bytes)
  return info
}

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
  // For each js file with a sourcemap, run source-map-explorer --json
  const explorerBin = existsSync(
    path.resolve('node_modules/.bin/source-map-explorer'),
  )
    ? path.resolve('node_modules/.bin/source-map-explorer')
    : 'npx'

  const perPackage = new Map()
  const perOwn = new Map()
  let totalMapped = 0

  const runCmdCapture = (cmd, args, opts = {}) =>
    new Promise((resolve) => {
      const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts })
      let stdout = ''
      let stderr = ''
      p.stdout.on('data', (d) => (stdout += d.toString()))
      p.stderr.on('data', (d) => (stderr += d.toString()))
      p.on('close', (code) => resolve({ stdout, stderr, code }))
      p.on('error', (err) => resolve({ stdout, stderr: String(err), code: 1 }))
    })

  const extractJsonSubstring = (text) => {
    const start = text.search(/[\[{]/)
    if (start === -1) return null
    // find last closing } or ]
    const lastCurly = text.lastIndexOf('}')
    const lastSquare = text.lastIndexOf(']')
    const end = Math.max(lastCurly, lastSquare)
    if (end === -1 || end <= start) return null
    return text.slice(start, end + 1)
  }

  const collectSourcesFromParsed = (parsed, accumulator) => {
    if (!parsed) return
    if (Array.isArray(parsed)) {
      for (const p of parsed) collectSourcesFromParsed(p, accumulator)
      return
    }
    if (typeof parsed !== 'object') return

    if (parsed.sources && typeof parsed.sources === 'object') {
      for (const [src, bytes] of Object.entries(parsed.sources)) {
        accumulator[src] = (accumulator[src] || 0) + Number(bytes || 0)
      }
      return
    }

    if (parsed.files && typeof parsed.files === 'object') {
      for (const [src, info] of Object.entries(parsed.files)) {
        const b = typeof info === 'number' ? info : info.size || info.bytes || 0
        accumulator[src] = (accumulator[src] || 0) + Number(b || 0)
      }
      return
    }

    // If object looks like mapping src->number
    const vals = Object.values(parsed)
    if (vals.length && vals.every((v) => typeof v === 'number')) {
      for (const [src, bytes] of Object.entries(parsed)) {
        accumulator[src] = (accumulator[src] || 0) + Number(bytes || 0)
      }
      return
    }

    // Otherwise, descend into object properties
    for (const v of Object.values(parsed)) {
      collectSourcesFromParsed(v, accumulator)
    }
  }

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
    try {
      const args =
        explorerBin === 'npx'
          ? ['source-map-explorer', f, '--json']
          : [f, '--json']
      const cmd = explorerBin === 'npx' ? 'npx' : explorerBin
      const { stdout, stderr, code } = await runCmdCapture(cmd, args)

      if (!stdout || stdout.trim().length === 0) {
        console.log(
          chalk.yellow(
            `Warning: source-map-explorer produced no JSON for ${f} (stderr: ${stderr.trim()})`,
          ),
        )
        continue
      }

      let parsed = null
      try {
        parsed = JSON.parse(stdout)
      } catch (e) {
        // Try to extract JSON substring in case the CLI emitted logs before/after json
        const sub = extractJsonSubstring(stdout)
        if (sub) {
          try {
            parsed = JSON.parse(sub)
          } catch (e2) {
            parsed = null
          }
        }
      }

      if (!parsed) {
        console.log(
          chalk.yellow(
            `Warning: could not parse JSON output from source-map-explorer for ${f}; attempting fallback to .map parsing.`,
          ),
        )
        // do not continue; try fallback below
      }

      const sourcesAcc = {}
      if (parsed) collectSourcesFromParsed(parsed, sourcesAcc)

      // Fallback: try reading the .map file directly and use sourcesContent or the original sources on disk
      if (!Object.keys(sourcesAcc).length) {
        try {
          const mapRaw = await fs.readFile(mapPath, 'utf8')
          let mapJson = null
          try {
            mapJson = JSON.parse(mapRaw)
          } catch (e) {
            mapJson = null
          }

          if (
            mapJson &&
            Array.isArray(mapJson.sources) &&
            mapJson.sources.length
          ) {
            const srcRoot = mapJson.sourceRoot || ''
            for (let i = 0; i < mapJson.sources.length; i++) {
              const src = mapJson.sources[i]
              let bytes = 0

              // prefer embedded sourcesContent if available
              if (
                Array.isArray(mapJson.sourcesContent) &&
                mapJson.sourcesContent[i]
              ) {
                bytes = Buffer.byteLength(mapJson.sourcesContent[i], 'utf8')
              } else {
                // Try resolving the original source file on disk using several heuristics
                let candidate = src
                candidate = candidate.replace(/^webpack:\/\//, '')
                candidate = candidate.replace(/^~\//, '')
                if (srcRoot) candidate = path.join(srcRoot, candidate)

                const tryPaths = []
                tryPaths.push(path.resolve(path.dirname(mapPath), candidate))
                tryPaths.push(path.resolve(candidate))
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
          } else {
            console.log(
              chalk.yellow(
                `Fallback: .map file has no "sources" array for ${f} (or could not parse .map).`,
              ),
            )
            continue
          }
        } catch (e) {
          console.log(
            chalk.yellow(
              `Fallback failed reading/parsing ${mapPath}: ${String(e)}`,
            ),
          )
          continue
        }
      }

      for (const [src, bytes] of Object.entries(sourcesAcc)) {
        const b = Number(bytes || 0)
        totalMapped += b

        // Heuristics: if the source path looks like local workspace code, classify as own
        const srcLower = String(src)
        if (
          srcLower.includes('/packages/') ||
          srcLower.includes('packages/') ||
          srcLower.includes('/pages/') ||
          srcLower.includes('/src/')
        ) {
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
    } catch (e) {
      console.log(
        chalk.red(`Error running source-map-explorer on ${f}: ${String(e)}`),
      )
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

function printHeader() {
  console.log(chalk.bold.cyan('\n=== DIST SIZE REPORT ===\n'))
}

;(async function main() {
  try {
    printHeader()
    const distFilesAll = await listDistFiles()

    // Dev-only exclusion list (basenames). Add names here to exclude dev/HMR helper files.
    const DEV_EXCLUDE_BASENAMES = new Set(['refresh.js'])
    const isDevFile = (p) => DEV_EXCLUDE_BASENAMES.has(path.basename(p))

    const excludedFiles = distFilesAll.filter((f) => isDevFile(f.path))
    let distFiles = distFilesAll.filter((f) => !isDevFile(f.path))

    const totalBytes = distFiles.reduce((s, f) => s + f.bytes, 0)
    console.log(
      `${chalk.bold('Total dist files:')} ${distFiles.length}  ${chalk.bold('Total size:')} ${human(totalBytes)}\n`,
    )

    console.log(chalk.bold.underline('All dist files (largest first):'))
    for (const f of distFiles) {
      console.log(`${chalk.yellow(human(f.bytes)).padEnd(12)}  ${f.path}`)
    }

    // Analyze JS files + sourcemaps
    const jsFiles = distFiles
      .filter((d) => d.path.endsWith('.js'))
      .map((d) => d.path)
    console.log(
      '\n' + chalk.bold.underline('Source-map analysis (dependencies vs own):'),
    )
    const { deps, own, totalMapped } = await analyzeSourcemaps(jsFiles)

    const depsBytes = deps.reduce((s, d) => s + d.bytes, 0)
    const ownBytes = own.reduce((s, o) => s + o.bytes, 0)
    console.log(
      `${chalk.bold('Mapped bytes:')} ${human(totalMapped)}  ${chalk.dim('(sum of sources from sourcemaps)')}`,
    )
    console.log(
      `${chalk.green('Dependencies total:')} ${human(depsBytes)}  ${chalk.magenta('Own code total:')} ${human(ownBytes)}\n`,
    )

    if (deps.length) {
      console.log(chalk.bold.underline('All dependencies (by mapped size):'))
      for (const d of deps)
        console.log(`${chalk.yellow(human(d.bytes)).padEnd(12)}  ${d.name}`)
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
      for (const o of own)
        console.log(`${chalk.yellow(human(o.bytes)).padEnd(12)}  ${o.path}`)
    }

    // Zips
    console.log('\n' + chalk.bold.underline('ZIP contents (dist-zip):'))
    const zipContents = await listZipContents()
    if (!zipContents.length)
      console.log(chalk.dim('No zip files found in dist-zip/'))
    for (const z of zipContents) {
      console.log(
        chalk.bold(
          `\n${path.basename(z.zip)}${z.bytes ? ` - file size ${human(z.bytes)}` : ''}`,
        ),
      )
      if (z.error)
        console.log(chalk.red.dim(`  Could not list zip contents: ${z.error}`))
      if (!z.entries || z.entries.length === 0) {
        console.log(chalk.dim('  (no entries listed)'))
        continue
      }
      for (const e of z.entries) {
        console.log(
          `  ${chalk.yellow(human(e.compressed)).padEnd(12)} ${e.name} ${chalk.dim(`(uncompressed ${human(e.uncompressed)})`)}`,
        )
      }
    }

    // --- Build normalized asset matrix across dist and zip versions
    const normalizeAssetName = (p) => {
      if (!p) return null
      // ignore source maps
      if (p.endsWith('.map')) return null
      // strip leading dist/ or ./dist/
      p = p.replace(/^\.\/|^\//, '')
      if (p.startsWith('dist/')) p = p.slice('dist/'.length)

      // For zip entries, they may be like 'options/assets/index-C70I1Fyf.js'
      // Remove Vite-style hash segments: '-<hash>' where <hash> can contain letters, numbers, '_' or '-'
      // Strip only when the hashed segment appears directly before the extension
      // Strip trailing hashed segments only when they look like generated hashes:
      // require token length >= 6 and include at least one digit, or an uppercase letter, or an underscore
      // Only strip tokens that contain uppercase letters or underscores (heuristic for generated hashes)
      p = p.replace(
        /-(?=(?:.*[A-Z])|(?:.*_))([A-Za-z0-9_-]{6,})(?=\.[^.]+$)/g,
        '',
      )

      return p
    }

    // --- discover referenced assets from HTML entrypoints and manifest.json (prefer these as "current")
    const referencedPaths = new Set()
    try {
      const htmlFiles = await fg(['dist/*.html'], { onlyFiles: true })
      for (const h of htmlFiles) {
        try {
          const txt = await fs.readFile(h, 'utf8')
          for (const m of txt.matchAll(/<script[^>]+src="([^"]+)"/g))
            referencedPaths.add(m[1].replace(/^\//, ''))
          for (const m of txt.matchAll(/<link[^>]+href="([^"]+)"/g))
            referencedPaths.add(m[1].replace(/^\//, ''))
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const manifestPath = 'dist/manifest.json'
      if (existsSync(manifestPath)) {
        try {
          const mf = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
          for (const v of Object.values(mf)) {
            if (v && typeof v === 'object') {
              if (v.file) referencedPaths.add(v.file)
              if (Array.isArray(v.css))
                for (const c of v.css) referencedPaths.add(c)
              if (Array.isArray(v.assets))
                for (const a of v.assets) referencedPaths.add(a)
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    // dist files: pick the current referenced variant when possible, otherwise latest mtime
    const distVariants = new Map() // normalized -> { path, bytes, mtimeMs, referenced }
    for (const f of distFiles) {
      const norm = normalizeAssetName(f.path)
      if (!norm) continue
      try {
        const st = statSync(f.path)
        const isReferenced =
          referencedPaths.has(f.path.replace(/^dist\//, '')) ||
          referencedPaths.has(path.basename(f.path))
        const cur = distVariants.get(norm)
        if (!cur) {
          distVariants.set(norm, {
            path: f.path,
            bytes: f.bytes,
            mtimeMs: st.mtimeMs,
            referenced: !!isReferenced,
          })
        } else {
          // prefer referenced variants, otherwise prefer newer mtime
          if (isReferenced && !cur.referenced) {
            distVariants.set(norm, {
              path: f.path,
              bytes: f.bytes,
              mtimeMs: st.mtimeMs,
              referenced: true,
            })
          } else if (isReferenced === cur.referenced) {
            if (st.mtimeMs > cur.mtimeMs) {
              distVariants.set(norm, {
                path: f.path,
                bytes: f.bytes,
                mtimeMs: st.mtimeMs,
                referenced: !!isReferenced,
              })
            }
          }
        }
      } catch (e) {
        // ignore
      }
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

    // NOTE: we will compute the union of names using only the selected versions (so older versions
    // not included via -v won't contribute rows).

    // Compute gzip sizes for dist representative files
    const gzipSizeForPath = (p) => {
      try {
        const buf = readFileSync(p)
        return zlib.gzipSync(buf).length
      } catch (e) {
        return 0
      }
    }

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
    const versions = sortedVersions.slice(0, versionsBack)

    // Build the union of names using only 'versions' (what's visible in the table) and any dist files
    const allNames = new Set([
      ...Array.from(distVariants.keys()),
      ...versions.flatMap((v) => Object.keys(zipEntriesMap[v] || {})),
    ])

    // For ordering: for each name pick the most recent source (dist variant mtime vs latest zip mtime that contains it)
    const nameMeta = [] // { name, recentMtime, recentSize }
    for (const name of allNames) {
      const distEntry = distVariants.get(name)
      let distMtime = distEntry ? distEntry.mtimeMs || 0 : 0
      let distSize = distEntry ? distEntry.bytes || 0 : 0

      let bestZipMtime = 0
      let bestZipSize = 0
      for (const v of versions) {
        if (zipEntriesMap[v] && zipEntriesMap[v][name] != null) {
          const zm = zipIndex[v].mtimeMs || 0
          if (zm > bestZipMtime) {
            bestZipMtime = zm
            bestZipSize = zipEntriesMap[v][name]
          }
        }
      }

      if (distMtime >= bestZipMtime)
        nameMeta.push({ name, recentMtime: distMtime, recentSize: distSize })
      else
        nameMeta.push({
          name,
          recentMtime: bestZipMtime,
          recentSize: bestZipSize,
        })
    }

    // sort by recentSize descending
    nameMeta.sort((a, b) => b.recentSize - a.recentSize)

    // column widths
    const nameColW = Math.max(20, ...Array.from(allNames).map((n) => n.length))
    const distColW = 12
    const verColW = 14

    const header = [
      'Name'.padEnd(nameColW),
      'dist'.padStart(distColW),
      ...versions.map((v) => v.padStart(verColW)),
    ]
    console.log('\n')
    console.log(chalk.bold(header.join('  ')))

    let totalDistUncompressed = 0
    let totalDistGzip = 0
    const totalsByVersion = {}
    for (const v of versions) totalsByVersion[v] = 0

    for (const row of nameMeta) {
      const name = row.name
      const distEntry = distVariants.get(name)
      const distBytes = distEntry ? distEntry.bytes : 0
      const distBytesStr = distEntry
        ? human(distBytes).padStart(distColW)
        : ''.padStart(distColW)

      const verCols = versions.map((v) => {
        const b =
          zipEntriesMap[v] && zipEntriesMap[v][name] != null
            ? zipEntriesMap[v][name]
            : 0
        if (b) return human(b).padStart(verColW)
        return ''.padStart(verColW)
      })

      console.log(
        `${name.padEnd(nameColW)}  ${distBytesStr}  ${verCols.join('  ')}`,
      )

      if (distEntry) {
        totalDistUncompressed += distBytes
        totalDistGzip += gzipSizeForPath(distEntry.path)
      }
      for (const v of versions) {
        if (zipEntriesMap[v] && zipEntriesMap[v][name] != null)
          totalsByVersion[v] += zipEntriesMap[v][name]
      }
    }

    // Totals row
    const totalsCols = versions.map((v) =>
      human(totalsByVersion[v]).padStart(verColW),
    )
    console.log(
      '-'.repeat(nameColW + distColW + versions.length * (verColW + 2)),
    )
    console.log(
      `${'TOTAL'.padEnd(nameColW)}  ${human(totalDistUncompressed).padStart(distColW)}  ${totalsCols.join('  ')}`,
    )
    console.log(
      `${'ZIPPED'.padEnd(nameColW)}  ${human(totalDistGzip).padStart(distColW)}  ${versions.map((v) => human(zipIndex[v].actualBytes).padStart(verColW)).join('  ')}`,
    )

    console.log('\n' + chalk.bold.green('Done.'))
  } catch (err) {
    console.error(chalk.red('Error:'), err)
    process.exitCode = 2
  }
})()
