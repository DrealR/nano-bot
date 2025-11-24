/**
 * Main Entry Point
 *
 * React application entry point.
 * Initializes React, imports global styles, and renders the App component.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Make sure index.html has a <div id="root"></div>');
}

// Create React root and render app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log startup info
console.log('🤖 NanoBot Framework');
console.log('Version: 1.0.0');
console.log('Environment:', import.meta.env.MODE);

// Performance monitoring
if (import.meta.env.DEV) {
  console.log('Development mode - Performance monitoring enabled');

  // Log render times
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'measure') {
        console.log(`⏱️  ${entry.name}: ${entry.duration.toFixed(2)}ms`);
      }
    }
  });

  observer.observe({ entryTypes: ['measure'] });
}

// Service Worker registration (for PWA support in the future)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('⚠️  Service Worker registration failed:', error);
      });
  });
}

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('🚨 Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Warn about missing API keys in development
if (import.meta.env.DEV) {
  const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
  const hasOpenRouterKey = !!import.meta.env.VITE_OPENROUTER_API_KEY;
  const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  if (!hasGroqKey && !hasOpenRouterKey && !hasGeminiKey) {
    console.warn('⚠️  No AI API keys found!');
    console.warn('Set one of the following in your .env file:');
    console.warn('  - VITE_GROQ_API_KEY');
    console.warn('  - VITE_OPENROUTER_API_KEY');
    console.warn('  - VITE_GEMINI_API_KEY');
    console.warn('Bots will have limited AI capabilities without API keys.');
  } else {
    if (hasGroqKey) console.log('✅ Groq API key found');
    if (hasOpenRouterKey) console.log('✅ OpenRouter API key found');
    if (hasGeminiKey) console.log('✅ Gemini API key found');
  }
}

// WebGL availability check
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
  console.error('🚨 WebGL is not supported in this browser!');
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0a0a1a;
        color: #ff3366;
        font-family: 'Courier New', monospace;
        text-align: center;
        padding: 20px;
      ">
        <h1 style="font-size: 48px; margin-bottom: 20px;">⚠️ WebGL Not Supported</h1>
        <p style="font-size: 18px; max-width: 600px; line-height: 1.6;">
          Your browser does not support WebGL, which is required for the NanoBot Framework.
          Please use a modern browser like Chrome, Firefox, Safari, or Edge.
        </p>
      </div>
    `;
  }
} else {
  const version = gl instanceof WebGL2RenderingContext ? '2.0' : '1.0';
  console.log(`✅ WebGL ${version} is supported`);
}

// Log system info
console.log('System Info:');
console.log('  User Agent:', navigator.userAgent);
console.log('  Platform:', navigator.platform);
console.log('  Language:', navigator.language);
console.log('  Hardware Concurrency:', navigator.hardwareConcurrency || 'unknown');
console.log('  Device Memory:', (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'unknown');
