import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function Inventory() {
  const { products } = useStore();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const getFilteredProducts = () => {
    if (filter === 'low') return products.filter(p => p.stock > 0 && p.stock <= 10);
    if (filter === 'out') return products.filter(p => p.stock === 0);
    return products;
  };

  const filteredProducts = getFilteredProducts();
  const totalValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">إدارة المخزون</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">إجمالي قيمة المخزون (بالشراء)</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalValue.toFixed(2)} ج.م</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:border-amber-500 transition" onClick={() => setFilter('low')}>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">أصناف قاربت على الانتهاء</p>
            <h3 className="text-2xl font-bold text-slate-800">{products.filter(p => p.stock > 0 && p.stock <= 10).length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:border-rose-500 transition" onClick={() => setFilter('out')}>
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowDownToLine className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">أصناف نفذت</p>
            <h3 className="text-2xl font-bold text-slate-800">{products.filter(p => p.stock === 0).length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex gap-4 p-4 border-b border-slate-100 bg-slate-50">
          <button className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white border hover:bg-slate-50 text-slate-700'}`} onClick={() => setFilter('all')}>الكل</button>
          <button className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'low' ? 'bg-amber-500 text-white' : 'bg-white border hover:bg-slate-50 text-slate-700'}`} onClick={() => setFilter('low')}>نواقص</button>
          <button className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'out' ? 'bg-rose-500 text-white' : 'bg-white border hover:bg-slate-50 text-slate-700'}`} onClick={() => setFilter('out')}>منتهية</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 font-medium text-slate-600">اسم الصنف</th>
                <th className="p-4 font-medium text-slate-600">الباركود</th>
                <th className="p-4 font-medium text-slate-600">الكمية الحالية</th>
                <th className="p-4 font-medium text-slate-600">الحالة</th>
                <th className="p-4 font-medium text-slate-600 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800 font-medium">{product.name}</td>
                  <td className="p-4 text-slate-500 font-mono text-sm">{product.barcode}</td>
                  <td className="p-4 font-bold text-slate-800">{product.stock}</td>
                  <td className="p-4">
                    {product.stock === 0 ? (
                      <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm font-medium">نفذت الكمية</span>
                    ) : product.stock <= 10 ? (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">قارب على الانتهاء</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">متوفر</span>
                    )}
                  </td>
                  <td className="p-4 flex items-center justify-center gap-2">
                    {/* Placeholder for adjust modal or direct link to purchase */}
                    <button className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                      <ArrowUpFromLine className="w-4 h-4" />
                      طلب شراء
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد سجلات تطابق الفلتر الحالي</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
