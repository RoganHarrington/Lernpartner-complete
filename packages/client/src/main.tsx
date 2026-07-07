import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/baloo-2/800.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './i18n';
import { installGlobalErrorLogging, log } from './services/sessionLog';
import App from './App';

installGlobalErrorLogging();
log('app.start');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
