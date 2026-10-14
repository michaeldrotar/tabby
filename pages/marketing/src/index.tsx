import './styles.css'
import { createRoot } from 'react-dom/client'
import { ProductDemo } from './DemoLoader'
import { Landing } from './Landing'

const query = new URLSearchParams(location.search)

createRoot(document.getElementById('root')!).render(
  query.has('capture') ? (
    <div className="capture-stage">
      <ProductDemo capture />
    </div>
  ) : (
    <Landing />
  ),
)
