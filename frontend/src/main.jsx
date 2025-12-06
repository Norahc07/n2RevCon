import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { initDB } from './utils/offlineStorage';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Immediately set white background before any rendering to prevent black flash
(function() {
  if (document.documentElement) {
    document.documentElement.style.setProperty('background-color', '#FFFFFF', 'important');
    document.documentElement.style.setProperty('background', '#FFFFFF', 'important');
  }
  if (document.body) {
    document.body.style.setProperty('background-color', '#FFFFFF', 'important');
    document.body.style.setProperty('background', '#FFFFFF', 'important');
  }
  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty('background-color', '#FFFFFF', 'important');
    root.style.setProperty('background', '#FFFFFF', 'important');
  }
})();

// Initialize IndexedDB for offline storage
initDB().catch(console.error);

// Register service worker for PWA (handled by Vite PWA plugin)
// The Vite PWA plugin automatically registers the service worker

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <React.StrictMode>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <CurrencyProvider>
            <App />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  </ErrorBoundary>
);

