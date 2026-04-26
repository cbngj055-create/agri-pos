import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Search, ShoppingCart, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sales() {
  const { sales, customers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toLowerCase().includes(searchLower) ||
      (customer?.name.toLowerCase().includes(searchLower) || false)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">سجل المبيعات والفواتير</h2>
        <Link 
          to="/invoice"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium shadow-sm"
        >
          <FileText className="w-5 h-5" />
          فاتورة مبيعات ذكية
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="text-slate-400 w-5 h-5 ml-2" />
        <input 
          type="text"
          placeholder="ابحث برقم الفاتورة أو اسم العميل..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">أحدث عمليات البيع</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white border-b border-slate-100 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-medium">رقم الفاتورة</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium">العميل</th>
                <th className="p-4 font-medium">نوع الدفع</th>
                <th className="p-4 font-medium">عدد الأصناف</th>
                <th className="p-4 font-medium">المبلغ الكلي</th>
                <th className="p-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const customer = customers.find(c => c.id === sale.customerId);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 transition text-sm">
                    <td className="p-4 text-emerald-700 font-mono font-medium">#{sale.id.slice(-6)}</td>
                    <td className="p-4 text-slate-600">{new Date(sale.date).toLocaleDateString('ar-EG')} {new Date(sale.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 text-slate-800 font-medium">{customer?.name || 'عميل نقدي سريع'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        sale.type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sale.type === 'cash' ? 'نقدي' : 'آجل'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{sale.items.length}</td>
                    <td className="p-4 text-slate-800 font-bold">{sale.total.toFixed(2)} ج.م</td>
                    <td className="p-4 flex items-center justify-center">
                      <button className="text-slate-400 hover:text-emerald-600 transition p-2 bg-slate-50 hover:bg-emerald-50 rounded-lg" title="عرض الفاتورة">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">لا توجد فواتير مبيعات مطابقة للبحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
