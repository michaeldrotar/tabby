import { once } from 'node:events'
import { WebSocketServer } from 'ws'
import { BUILD_COMPLETE, DO_UPDATE, DONE_UPDATE } from '../consts.js'
import MessageInterpreter from '../interpreter/index.js'
import type { AddressInfo } from 'node:net'
import type { WebSocket } from 'ws'

export const startReloadServer = async (port: number) => {
  const clientsThatNeedToUpdate = new Set<WebSocket>()
  const servers: WebSocketServer[] = []
  const close = async () => {
    for (const server of servers) {
      for (const client of server.clients) client.terminate()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }

  try {
    for (const host of ['127.0.0.1', '::1']) {
      const wss = new WebSocketServer({ host, port })
      wss.on('connection', (ws) => {
        clientsThatNeedToUpdate.add(ws)

        ws.addEventListener('close', () => {
          clientsThatNeedToUpdate.delete(ws)
        })

        ws.addEventListener('message', (event) => {
          if (typeof event.data !== 'string') return

          const message = MessageInterpreter.receive(event.data)

          if (message.type === DONE_UPDATE) {
            ws.close()
          }

          if (message.type === BUILD_COMPLETE) {
            clientsThatNeedToUpdate.forEach((ws: WebSocket) =>
              ws.send(
                MessageInterpreter.send({ type: DO_UPDATE, id: message.id }),
              ),
            )
          }
        })
      })

      try {
        await once(wss, 'listening')
      } catch (error) {
        const { code } = error as NodeJS.ErrnoException
        if (
          host === '::1' &&
          (code === 'EAFNOSUPPORT' || code === 'EADDRNOTAVAIL')
        )
          continue
        throw error
      }
      servers.push(wss)
      port = (wss.address() as AddressInfo).port
    }
  } catch (error) {
    await close()
    throw error
  }

  return { port, close }
}
