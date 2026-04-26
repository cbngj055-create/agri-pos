import React, { useState } from 'react';
import { Store, Search, Edit, Trash2, Ban, CheckCircle } from 'lucide-react';

export default function AdminTenants() {
  const [searchTerm, setSearchTerm] = useState('');

  const mockTenants = [
    { id: '1', name: 'مؤسسة النور الزراعية', owner: 'أحمد محمد', phone: '01012345678', plan: 'pro', status: 'active', joinDate: '2024-01-15' },
    { id: '2', name: 'محلات التقوى للأسمدة', owner: 'محمود علي', phone: '01123456789', plan: 'basic', status: 'active', joinDate: '2024-02-20' },
    { id: '3', name: 'شركة الوادي الأخضر', owner: 'سيد مصطفيف', phone: '01234567890', plan: 'trial', status: 'suspended', joinDate: '2024-03-10' },
    { id: '4', name: 'مشتل الزهور', owner: 'عمر حسن', phone: '01512345678', plan: 'premium', status: 'active', joinDate: '2024-04-05' },
  ];

  const filtered = mockTenants.filter(t => t.name.includes(searchTerm) || t.owner.includes(searchTerm) || t.phone.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Store className="w-6 h-6 text-emerald-600" />
          إدارة المتاجر والعملاء
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-2.5 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ابحث باسم المتجر أو المالك أو رقم الهاتف..."
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-bold">اسم المتجر</th>
                <th className="p-4 font-bold">المالك / الهاتف</th>
                <th className="p-4 font-bold">تاريخ الانضمام</th>
                <th className="p-4 font-bold">الباقة</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{tenant.name}</div>
                    <div className="text-xs text-slate-500">ID: {tenant.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-800">{tenant.owner}</div>
                    <div className="text-sm text-slate-500" dir="ltr">{tenant.phone}</div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(tenant.joinDate).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="p-4">
                    {tenant.plan === 'pro' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">برو</span>}
                    {tenant.plan === 'basic' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">أساسي</span>}
                    {tenant.plan === 'premium' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">بريميوم</span>}
                    {tenant.plan === 'trial' && <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">تجريبي</span>}
                  </td>
                  <td className="p-4">
                    {tenant.status === 'active' ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> نشط
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 text-sm font-medium">
                        <Ban className="w-4 h-4" /> موقوف
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title={tenant.status === 'active' ? 'إيقاف' : 'حذف'}>
                         {tenant.status === 'active' ? <Ban className="w-4 h-4" /> : <Trash2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
