import React, {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initDatabase } from './db/database.js';
import { initSyncSystem } from './services/syncService.js';
import { useStore } from './store/useStore.js';

// Register PWA service worker
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

// Listen for background sync messages from SW
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
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
  const [initError, setInitError] = useState<string | null>(null);
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
        setInitError((err as Error).message || 'فشل تحميل قاعدة البيانات');
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

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 font-readex mb-2">خطأ في تحميل النظام</h2>
          <p className="text-red-600 font-readex mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-readex hover:bg-emerald-700 transition-colors"
          >
            إعادة المحاولة
          </button>
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
