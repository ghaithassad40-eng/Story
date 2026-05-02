import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// App splash loader — auto-hides after 2.3s (CSS fade starts at 1.6s)
const loaderEl = document.getElementById('app-loader')
if (loaderEl) {
  setTimeout(() => {
    loaderEl.style.display = 'none'
  }, 2400)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
