import { LOCAL_RELOAD_SOCKET_PORT, LOCAL_RELOAD_SOCKET_URL } from '../consts.js'
import { startReloadServer } from './reload-server.js'

try {
  await startReloadServer(LOCAL_RELOAD_SOCKET_PORT)
  console.log(`[HMR] Server listening at ${LOCAL_RELOAD_SOCKET_URL}`)
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.info(
      `[HMR] Server already running at ${LOCAL_RELOAD_SOCKET_URL}, skipping reload server initialization`,
    )
  } else {
    console.error(`[HMR] Failed to start server at ${LOCAL_RELOAD_SOCKET_URL}`)
    throw error
  }
}
