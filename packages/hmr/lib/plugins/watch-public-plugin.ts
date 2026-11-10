import fg from 'fast-glob'
import type { PluginOption } from 'vite'

export const watchPublicPlugin = (): PluginOption => {
  let publicDir: string | false
  return {
    name: 'watch-public-plugin',
    configResolved(config) {
      publicDir = config.publicDir
    },
    async buildStart() {
      if (!publicDir) return
      const files = await fg('**/*', { cwd: publicDir, absolute: true })
      this.addWatchFile(publicDir)
      for (const file of files) this.addWatchFile(file)
    },
  }
}
