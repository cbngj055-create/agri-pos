import React from 'react';
import { Bell, Plus, FileText, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SyncIndicator from './SyncIndicator.js';

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800 hidden md:block">لوحة التحكم</h2>
      </div>
      <div className="flex items-center gap-4">
        <SyncIndicator />
        <Link to="/invoice" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition">
          <Plus className="w-4 h-4" />
          <span>فاتورة مبيعات جديدة</span>
        </Link>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
          <FileText className="w-5 h-5" />
        </button>
        <button className="p-2 text-amber-500 hover:bg-amber-50 rounded-full transition">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 text-right">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">م</div>
          <span className="text-sm font-medium">المدير المسؤول</span>
        </div>
      </div>
    </header>
  );
}
