import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'

async function bootstrap() {
  // En web (browser/dev), inicializar jeep-sqlite ANTES de montar React
  if (Capacitor.getPlatform() === 'web') {
    const { defineCustomElements } = await import('jeep-sqlite/loader')
    defineCustomElements(window)

    if (!document.querySelector('jeep-sqlite')) {
      const jeepEl = document.createElement('jeep-sqlite')
      document.body.prepend(jeepEl)
    }

    await customElements.whenDefined('jeep-sqlite')
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap().catch((err) => {
  console.error('[bootstrap] ERROR FATAL:', err)
})
