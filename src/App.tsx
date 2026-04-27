import React, { useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Invoice from './pages/Invoice';
import Inventory from './pages/Inventory';
import DataEntry from './pages/DataEntry';
import Finance from './pages/Finance';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Sales from './pages/Sales';
import HR from './pages/HR';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import Prescriptions from './pages/Prescriptions';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PinLock from './components/PinLock';
import { getSyncMeta } from './db/database.js';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTenants from './pages/admin/AdminTenants';

function hasToken(): boolean {
  return Boolean(getSyncMeta('auth_token'));
}

function pinEnabled(): boolean {
  return getSyncMeta('pin_enabled') === '1';
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function RootRoute() {
  const authed = useMemo(() => hasToken(), []);
  return authed ? <Navigate to="/app" replace /> : <Landing />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const authed = useMemo(() => hasToken(), []);
  return authed ? <Navigate to="/app" replace /> : <>{children}</>;
}

function ProtectedApp({ children }: { children: React.ReactNode }) {
  const authed = useMemo(() => hasToken(), []);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('pin_unlocked') === '1');

  if (!authed) return <Navigate to="/login" replace />;

  if (pinEnabled() && !unlocked) {
    return (
      <PinLock
        onUnlock={() => {
          sessionStorage.setItem('pin_unlocked', '1');
          setUnlocked(true);
        }}
        isPinValid={async (pin) => {
          const saved = getSyncMeta('pin_hash');
          if (!saved) return false;
          const hashed = await sha256(pin);
          return hashed === saved;
        }}
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedApp>
              <Layout />
            </ProtectedApp>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="data-entry" element={<DataEntry />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="sales" element={<Sales />} />
          <Route path="payments" element={<Payments />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="finance" element={<Finance />} />
          <Route path="hr" element={<HR />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
