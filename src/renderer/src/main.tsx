import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

document.documentElement.dataset.platform = window.api.system.getPlatform()
document.documentElement.dataset.theme = 'obsidian'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Renderer root element is missing')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
