import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AccessClosed from './components/AccessClosed.tsx'
import './index.css'

// Dataroom fermée : on rend la page d'accès restreint.
// (Pour rouvrir : remettre `import App from './App.tsx'` et rendre <App />.)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessClosed />
  </StrictMode>,
)
