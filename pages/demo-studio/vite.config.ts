import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  publicDir: '../../chrome-extension/public',
  build: { outDir: 'build' },
})
