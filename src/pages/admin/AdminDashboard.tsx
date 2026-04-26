import React from 'react';
import { Users, Store, CreditCard, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { title: 'إجمالي المتاجر', value: '156', change: '+12%', icon: Store, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'الاشتراكات النشطة', value: '142', change: '+8%', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'إيرادات الشهر', value: '45,000 ج.م', change: '+24%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'مستخدمي النظام', value: '890', change: '+18%', icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">نظرة عامة على النظام</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Mock Chart / Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">التسجيلات الجديدة</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-slate-400">رسم بياني للمتاجر المسجلة مؤخراً</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">آخر المتاجر المنضمة</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    م
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">متجر زراعي {i}</h4>
                    <p className="text-xs text-slate-500">تم التسجيل منذ {i * 2} ساعات</p>
                  </div>
                </div>
                <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  تجريبي
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
