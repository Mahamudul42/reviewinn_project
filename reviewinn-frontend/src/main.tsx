import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/App.css'
import App from './App.tsx'
import { ToastContainer } from './shared/design-system/components/Toast'
import { ToastProvider } from './shared/components/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <ToastContainer />
    </ToastProvider>
  </StrictMode>,
)
