import React from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const { sales, products, expenses } = useStore();

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

  // Profit estimation for the current data
  const estimatedProfit = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      const buyPrice = product ? product.purchasePrice : item.price * 0.7; 
      return itemSum + ((item.price - buyPrice) * item.quantity);
    }, 0);
  }, 0) - totalExpenses;

  // Best selling products
  const productSalesMap = new Map<string, {name: string, qty: number, revenue: number}>();
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const current = productSalesMap.get(product.id) || { name: product.name, qty: 0, revenue: 0 };
        productSalesMap.set(product.id, {
          name: product.name,
          qty: current.qty + item.quantity,
          revenue: current.revenue + (item.price * item.quantity)
        });
      }
    });
  });

  const bestSelling = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const pieData = bestSelling.map(item => ({ name: item.name, value: item.revenue }));
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">التقارير الشاملة</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium mb-1">إجمالي المبيعات</p>
          <p className="text-2xl font-bold text-slate-800">{totalSales.toFixed(2)} ج.م</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium mb-1">صافي الأرباح (التقديرية)</p>
          <p className="text-2xl font-bold text-emerald-600">{estimatedProfit.toFixed(2)} ج.م</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium mb-1">عدد الطلبات (الفواتير)</p>
          <p className="text-2xl font-bold text-slate-800">{sales.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium mb-1">الوحدات المباعة</p>
          <p className="text-2xl font-bold text-slate-800">{totalItemsSold}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">إيرادات أعلى 5 أصناف مبيعاً</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {pieData.length === 0 && <p className="text-center text-slate-500 -mt-32 relative z-10">لا توجد بيانات كافية</p>}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">الأصناف الأكثر حركة (بالكمية)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-slate-600 font-medium rounded-r-lg">الصنف</th>
                  <th className="p-3 text-slate-600 font-medium">الكمية المباعة</th>
                  <th className="p-3 text-slate-600 font-medium rounded-l-lg">الإيراد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bestSelling.map(item => (
                  <tr key={item.name}>
                    <td className="p-3 font-medium text-slate-800">{item.name}</td>
                    <td className="p-3 text-slate-800">{item.qty} وحدة</td>
                    <td className="p-3 text-emerald-600 font-bold">{item.revenue} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bestSelling.length === 0 && <p className="text-center text-slate-500 mt-8">لا توجد بيانات كافية</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
