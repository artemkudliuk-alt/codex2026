import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // before scroll.js: it measures the layout on import
import './scroll.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
