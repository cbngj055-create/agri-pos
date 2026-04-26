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

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTenants from './pages/admin/AdminTenants';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes */}
        <Route path="/app" element={<Layout />}>
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
