import React from 'react';
import { Bell } from 'lucide-react';

export default function AdminTopbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800 hidden md:block">لوحة التحكم الإدارية</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-amber-500 hover:bg-amber-50 rounded-full transition">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 text-right">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">أ</div>
          <span className="text-sm font-medium">المدير العام</span>
        </div>
      </div>
    </header>
  );
}
