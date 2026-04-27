import React from 'react';
import { useStore } from '../store/useStore';
import { Package, Users, Truck, ShoppingCart, TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { products, customers, suppliers, sales } = useStore();

  const totalSalesToday = sales
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.total, 0);

  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      name: d.toLocaleDateString('ar-EG', { month: 'short' })
    };
  }).reverse();

  const chartData = last6Months.map(m => {
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate.getMonth() === m.month && saleDate.getFullYear() === m.year;
    }).reduce((sum, s) => sum + s.total, 0);

    return {
      name: m.name,
      sales: monthSales
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">مرحباً بك في نظام المتجر الزراعي</h2>
        <p className="text-slate-500">إدارة شاملة لجميع عمليات المتجر من مبيعات ومشتريات ومخزون</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} title="إجمالي الأصناف" value={products.length} color="blue" />
        <StatCard icon={ShoppingCart} title="المبيعات (اليوم)" value={`${totalSalesToday} ج.م`} color="emerald" />
        <StatCard icon={Users} title="إجمالي العملاء" value={customers.length} color="amber" />
        <StatCard icon={Truck} title="إجمالي الموردين" value={suppliers.length} color="rose" />
      </div>

      <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">إجراءات سريعة</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/app/products" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center justify-center gap-3 h-32">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Package className="w-6 h-6" />
          </div>
          <span className="font-medium text-slate-700">تسجيل الأصناف</span>
        </Link>
        <Link to="/app/invoice" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center justify-center gap-3 h-32">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <FileText className="w-6 h-6" />
          </div>
          <span className="font-medium text-slate-700">فاتورة مبيعات ذكية</span>
        </Link>
        <Link to="/app/purchases" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center justify-center gap-3 h-32">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
            <Truck className="w-6 h-6" />
          </div>
          <span className="font-medium text-slate-700">فاتورة مشتريات</span>
        </Link>
        <Link to="/app/reports" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center justify-center gap-3 h-32">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="font-medium text-slate-700">التقارير</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">مبيعات الأشهر الستة الماضية</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">النشاطات الأخيرة</h3>
          <div className="space-y-4">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">فاتورة مبيعات جديدة</p>
                  <p className="text-sm text-slate-500 border-none">{sale.total} ج.م - {new Date(sale.date).toLocaleTimeString('ar-EG')}</p>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-8 text-slate-500">لا توجد نشاطات حديثة</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: any) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
      <div>
        <p className="text-slate-500 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${colorMap[color]}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );
}
