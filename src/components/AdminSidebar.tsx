import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Store, Settings, CreditCard } from 'lucide-react';

const menuItems = [
  { path: '/admin', name: 'نظرة عامة', icon: LayoutDashboard },
  { path: '/admin/tenants', name: 'المتاجر والعملاء', icon: Store },
  { path: '/admin/subscriptions', name: 'الاشتراكات والمدفوعات', icon: CreditCard },
  { path: '/admin/settings', name: 'إعدادات النظام', icon: Settings },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded p-1.5">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">لوحة الإدارة</h1>
            <p className="text-xs text-slate-400">النظام السحابي الزراعي</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 ml-3" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <Users className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">المدير العام</p>
            <p className="text-xs text-slate-400">admin@system.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
