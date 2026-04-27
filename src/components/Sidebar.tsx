import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Barcode, 
  PackageSearch,
  ShoppingCart, 
  Truck, 
  Users, 
  Wallet,
  Briefcase,
  FileBarChart,
  FileText,
  Settings,
  Store,
  LogOut
} from 'lucide-react';
import { logout } from '../services/syncService.js';

const menuItems = [
  { path: '/app', name: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/app/invoice', name: 'فاتورة مبيعات ذكية', icon: Store },
  { path: '/app/data-entry', name: 'تسجيل البيانات', icon: Database },
  { path: '/app/products', name: 'الباركود والأصناف', icon: Barcode },
  { path: '/app/inventory', name: 'إدارة المخزون', icon: PackageSearch },
  { path: '/app/purchases', name: 'المشتريات والموردين', icon: Truck },
  { path: '/app/sales', name: 'المبيعات والعملاء', icon: ShoppingCart },
  { path: '/app/payments', name: 'المدفوعات والديون', icon: Wallet },
  { path: '/app/prescriptions', name: 'روشتات المحاصيل', icon: FileText },
  { path: '/app/finance', name: 'الحسابات والمصروفات', icon: Briefcase },
  { path: '/app/hr', name: 'شؤون الموظفين', icon: Users },
  { path: '/app/reports', name: 'التقارير الشاملة', icon: FileBarChart },
  { path: '/app/settings', name: 'الإعدادات العامة', icon: Settings },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#064e3b] text-white flex flex-col shadow-xl h-full z-20 relative">
      <div className="p-6 flex items-center gap-3 border-b border-emerald-800">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-xl font-bold">🌱</div>
        <span className="text-xl font-bold tracking-tight">نظام المتجر الزراعي</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
                    isActive
                      ? 'bg-emerald-700/50 text-white'
                      : 'text-emerald-50 hover:bg-emerald-800 hover:text-white'
                  }`
                }
                onClick={() => onNavigate?.()}
              >
                <item.icon className="w-5 h-5 ml-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-emerald-800 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 ml-3" />
          تسجيل الخروج
        </button>
        <div className="text-xs text-emerald-400 flex justify-between">
          <span>v3.0.0</span>
          <span>Offline-First + Sync</span>
        </div>
      </div>
    </aside>
  );
}
