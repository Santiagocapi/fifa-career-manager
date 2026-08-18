// ============================================================
// src/main.tsx
// Application entry point.
//
// React 18 uses createRoot() instead of ReactDOM.render().
// The <StrictMode> wrapper makes React run components twice
// in development to help catch bugs. It has no effect in production.
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
