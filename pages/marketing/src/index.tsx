import './styles.css'
import { createRoot } from 'react-dom/client'
import { ProductDemo } from './DemoLoader'
import { Landing } from './Landing'
import type { Design } from './content'

const query = new URLSearchParams(location.search)
const pathDesign = location.pathname.split('/').filter(Boolean).at(-1)
const requested = ['companion', 'focus', 'playground'].includes(
  pathDesign ?? '',
)
  ? pathDesign
  : query.get('design')
const design: Design =
  requested === 'focus' || requested === 'playground' ? requested : 'companion'

createRoot(document.getElementById('root')!).render(
  query.has('capture') ? (
    <div className="capture-stage">
      <ProductDemo capture />
    </div>
  ) : (
    <Landing design={design} />
  ),
)
