import { once } from 'node:events'
import { networkInterfaces } from 'node:os'
import { afterEach, expect, test } from 'vitest'
import { WebSocket } from 'ws'
import { BUILD_COMPLETE, DO_UPDATE, DONE_UPDATE } from '../consts.js'
import MessageInterpreter from '../interpreter/index.js'
import { startReloadServer } from './reload-server.js'

let server: Awaited<ReturnType<typeof startReloadServer>>
afterEach(async () => {
  await server?.close()
})

const connect = async (host: string) => {
  const client = new WebSocket(`ws://${host}:${server.port}`, {
    handshakeTimeout: 1000,
  })
  await once(client, 'open')
  return client
}

test('reload reaches localhost clients across loopback families and closes on completion', async () => {
  server = await startReloadServer(0)
  const client = await connect('localhost')
  const builder = await connect('127.0.0.1')
  const ipv6 = await connect('[::1]')
  const messages = [client, ipv6].map(async (socket) => {
    const [data] = await once(socket, 'message')
    expect(MessageInterpreter.receive(String(data))).toEqual({
      type: DO_UPDATE,
      id: 'extension',
    })
    const closed = once(socket, 'close')
    socket.send(MessageInterpreter.send({ type: DONE_UPDATE }))
    await closed
  })
  builder.send(
    MessageInterpreter.send({ type: BUILD_COMPLETE, id: 'extension' }),
  )
  await Promise.all(messages)
})

test('reload listener refuses non-loopback connections', async () => {
  server = await startReloadServer(0)
  const address = Object.values(networkInterfaces())
    .flat()
    .find((entry) => entry && !entry.internal && entry.family === 'IPv4')
  expect(address).toBeDefined()
  await expect(connect(address!.address)).rejects.toThrow()
})
