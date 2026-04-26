import React, {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initDatabase } from './db/database.js';
import { initSyncSystem } from './services/syncService.js';
import { useStore } from './store/useStore.js';

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

// Listen for background sync messages from SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PERFORM_SYNC') {
      import('./services/syncService.js').then(({ performFullSync }) => {
        performFullSync();
      });
    }
  });
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const initStore = useStore((s) => s.initStore);

  useEffect(() => {
    async function boot() {
      try {
        await initDatabase();
        await initStore();
        initSyncSystem();
        setReady(true);
      } catch (err) {
        console.error('Boot failed:', err);
        setReady(true);
      }
    }
    boot();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mx-auto mb-4">🌱</div>
          <p className="text-gray-500 font-readex">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer>
      <App />
    </AppInitializer>
  </StrictMode>,
);
