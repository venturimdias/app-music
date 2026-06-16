import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Provider fica montado em toda a sessão (evita o bug de leak de script/badge
// do react-google-recaptcha-v3 ao montar/desmontar por rota). O badge visual
// é escondido via CSS (.grecaptcha-badge em index.css) — só aparece o texto
// de atribuição nas próprias páginas de Login/Register.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </GoogleReCaptchaProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
