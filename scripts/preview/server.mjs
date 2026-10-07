import { readFile, access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const previewDirectory = dirname(fileURLToPath(import.meta.url))
const workspace = resolve(previewDirectory, '../..')
const defaultFixture = resolve(previewDirectory, 'browser-data.json')
const mockPath = '/__preview/mock-chrome.js'
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

export const createPreviewServer = ({
  distDirectory = resolve(workspace, 'dist'),
  fixturePath = defaultFixture,
} = {}) =>
  createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      )
      if (pathname === mockPath) {
        const [browser, messages, mock] = await Promise.all([
          readFile(fixturePath, 'utf8'),
          readFile(
            resolve(workspace, 'packages/i18n/locales/en/messages.json'),
            'utf8',
          ),
          readFile(resolve(previewDirectory, 'mock-chrome.js'), 'utf8'),
        ])
        const config = {
          browser: JSON.parse(browser),
          messages: JSON.parse(messages),
          platform:
            process.platform === 'darwin'
              ? 'mac'
              : process.platform === 'win32'
                ? 'win'
                : 'linux',
        }
        response.writeHead(200, { 'Content-Type': contentTypes['.js'] })
        response.end(
          `globalThis.__TABBY_PREVIEW__ = ${JSON.stringify(config)};\n${mock}`,
        )
        return
      }

      const file = resolve(
        distDirectory,
        `.${pathname === '/' ? '/tab-manager/index.html' : pathname}`,
      )
      const pathFromDist = relative(distDirectory, file)
      if (pathFromDist.startsWith('..') || isAbsolute(pathFromDist)) {
        response.writeHead(403).end()
        return
      }
      let contents = await readFile(file)
      const extension = extname(file)
      if (extension === '.html') {
        contents = contents
          .toString()
          .replace(/<head\b[^>]*>/i, `$&<script src="${mockPath}"></script>`)
      }
      response.writeHead(200, {
        'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      })
      response.end(contents)
    } catch (error) {
      const status =
        error instanceof URIError
          ? 400
          : error.code === 'ENOENT' || error.code === 'EISDIR'
            ? 404
            : 500
      if (status === 500) console.error(error)
      response.writeHead(status).end()
    }
  })

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { values } = parseArgs({
    options: {
      port: { type: 'string', default: '0' },
      fixture: { type: 'string', default: defaultFixture },
    },
  })
  const port = Number(values.port)
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('--port must be an integer between 0 and 65535.')
  }
  await access(resolve(workspace, 'dist/tab-manager/index.html'))
  const fixturePath = resolve(values.fixture)
  JSON.parse(await readFile(fixturePath, 'utf8'))
  const server = createPreviewServer({ fixturePath })
  server.on('error', (error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(
      `Tab Manager preview: http://localhost:${server.address().port}/tab-manager/index.html`,
    )
  })
}
