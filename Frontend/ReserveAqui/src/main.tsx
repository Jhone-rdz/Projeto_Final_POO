import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

const parseBooleanEnv = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined || value === null || value === '') return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    sendDefaultPii: parseBooleanEnv(import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII, false),
    enableLogs: parseBooleanEnv(import.meta.env.VITE_SENTRY_ENABLE_LOGS, false),
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div>Ocorreu um erro inesperado. Tente recarregar a aplicação.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
