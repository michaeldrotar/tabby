import './styles.css'
import { createRoot } from 'react-dom/client'
import { BrowserIllustration } from './DemoLoader'
import { Landing } from './Landing'

const query = new URLSearchParams(location.search)

const page =
  location.pathname.replace(/\/$/, '') === '/whats-new' ? (
    import('./WhatsNew').then(({ WhatsNew }) => <WhatsNew />)
  ) : query.has('capture') ? (
    <div className="capture-stage">
      <BrowserIllustration capture />
    </div>
  ) : (
    <Landing />
  )

void Promise.all([
  page,
  Promise.allSettled([
    document.fonts.load('700 1em Bricolage'),
    document.fonts.load('400 1em Manrope'),
    document.fonts.load('700 1em Manrope'),
  ]),
]).then(([page]) => createRoot(document.getElementById('root')!).render(page))
