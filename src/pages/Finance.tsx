import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';

export default function Finance() {
  const { sales, purchases, expenses, addExpense } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: 0, category: '', description: '' });

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Approximate profit calculation for display
  const totalProfit = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      // Find purchase price (approximate, should track per item sale)
      const purchasePrice = item.price * 0.7; // Fallback mock calculation if needed, but let's use exact from store if possible.
      // Wait, we don't store purchasePrice in Sale item currently, just sale price.
      // To get real profit we need cost of goods sold. For now, an estimation or standard calculation:
      return itemSum + (item.price * item.quantity);
    }, 0);
  }, 0) - totalPurchases - totalExpenses; // Just simple cashflow for now

  const profitValue = totalSales - totalPurchases - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: formData.amount,
      category: formData.category,
      description: formData.description
    });
    setIsModalOpen(false);
    setFormData({ amount: 0, category: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">الحسابات والأرباح</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          تسجيل مصروف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">إجمالي الإيرادات</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalSales.toFixed(2)} ج.م</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">إجمالي المشتريات</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalPurchases.toFixed(2)} ج.م</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">المصروفات الإدارية</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalExpenses.toFixed(2)} ج.م</h3>
          </div>
        </div>
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-sm border border-emerald-500 flex items-center gap-4 text-white">
          <div className="p-4 bg-white/20 rounded-xl mt-auto mb-auto">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-emerald-100 font-medium">صافي التدفق النقدي</p>
            <h3 className="text-2xl font-bold">{profitValue.toFixed(2)} ج.م</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">سجل المصروفات الأخير</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="p-4 font-medium text-slate-600">التاريخ</th>
                <th className="p-4 font-medium text-slate-600">التصنيف</th>
                <th className="p-4 font-medium text-slate-600">البيان</th>
                <th className="p-4 font-medium text-slate-600">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800">{new Date(expense.date).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4 text-slate-800 font-medium">{expense.category}</td>
                  <td className="p-4 text-slate-500">{expense.description}</td>
                  <td className="p-4 text-rose-600 font-bold">{expense.amount} ج.م</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">لا توجد سجلات مصروفات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">إضافة مصروف جديد</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ</label>
                <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف (كهرباء، إيجار، عمالة...)</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">البيان / التفاصيل</label>
                <textarea className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium">حفظ</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 transition font-medium">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
