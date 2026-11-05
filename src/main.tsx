import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import {
  applyLanguage,
  applyTheme,
  readStoredLanguage,
  readStoredTheme,
} from './app/preferences';
import { initI18n } from './i18n';
import './index.css';

const language = readStoredLanguage();
const theme = readStoredTheme();

applyLanguage(language);
applyTheme(theme);

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

function render(): void {
  const container = document.getElementById('root');
  if (!container) return;
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

initI18n(language)
  .catch((error: unknown) => {
    console.error('[nrc] failed to initialise i18n', error);
  })
  .finally(render);
