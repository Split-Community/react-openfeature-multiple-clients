import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { bootstrapOpenFeature } from './openfeature-bootstrap';

const el = document.getElementById('root');
if (!el) {
  throw new Error('Missing #root');
}

void bootstrapOpenFeature()
  .then(() => {
    createRoot(el).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    console.error(err);
    el.textContent = 'Feature flags failed to initialize. Check the console and your SDK key.';
  });
