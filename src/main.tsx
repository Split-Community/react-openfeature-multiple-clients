/**
 * @file Vite entry: mounts App. OpenFeature provider registration lives in App.tsx so it runs when
 * that module loads, before the first hook evaluation.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const el = document.getElementById('root');
if (!el) {
  throw new Error('Missing #root');
}
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
