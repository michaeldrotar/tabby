import '@src/index.css'
import { createRoot } from 'react-dom/client'
import { initDevProfiler } from './initDevProfiler'

declare const __TABBY_ARCHITECTURE_PROOF__: boolean

const init = async () => {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)
  const { Root } =
    __TABBY_ARCHITECTURE_PROOF__ &&
    new URLSearchParams(location.search).get('architecture') === 'provider'
      ? await import('./ArchitectureProof')
      : await import('./Root')
  root.render(<Root />)

  initDevProfiler()
}

void init()
