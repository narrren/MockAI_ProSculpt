import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress ResizeObserver errors (harmless browser quirk)
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args[0];
  if (
    (typeof errorMessage === 'string' && 
     (errorMessage.includes('ResizeObserver loop') ||
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications'))) ||
    (errorMessage && typeof errorMessage === 'object' && 
     errorMessage.message && 
     errorMessage.message.includes('ResizeObserver'))
  ) {
    return; // Suppress ResizeObserver errors
  }
  originalError.call(console, ...args);
};

// Suppress ResizeObserver errors in error handler
window.addEventListener('error', (e) => {
  if (
    e.message &&
    (e.message.includes('ResizeObserver loop') ||
     e.message.includes('ResizeObserver loop completed with undelivered notifications') ||
     e.message.includes('ResizeObserver'))
  ) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }
}, true); // Use capture phase

// Suppress ResizeObserver errors in unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  if (
    e.reason &&
    typeof e.reason === 'object' &&
    e.reason.message &&
    (e.reason.message.includes('ResizeObserver loop') ||
     e.reason.message.includes('ResizeObserver loop completed with undelivered notifications') ||
     e.reason.message.includes('ResizeObserver'))
  ) {
    e.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

