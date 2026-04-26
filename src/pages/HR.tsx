import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Users, Trash2, Mail, Phone } from 'lucide-react';

export default function HR() {
  const { employees, addEmployee, deleteEmployee } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    salary: 0,
    joinDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      id: Date.now().toString(),
      ...formData
    });
    setIsModalOpen(false);
    setFormData({ name: '', role: '', phone: '', salary: 0, joinDate: new Date().toISOString().split('T')[0] });
  };

  const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">شؤون الموظفين والعاملين</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة موظف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">إجمالي عدد الموظفين</p>
            <h3 className="text-2xl font-bold text-slate-800">{employees.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-medium">إجمالي الرواتب الشهرية</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalSalaries.toFixed(2)} ج.م</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">سجل الموظفين</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white border-b border-slate-100 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-medium">اسم الموظف</th>
                <th className="p-4 font-medium">المسمى الوظيفي</th>
                <th className="p-4 font-medium">رقم الهاتف</th>
                <th className="p-4 font-medium">تاريخ التعيين</th>
                <th className="p-4 font-medium">الراتب الأساسي</th>
                <th className="p-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50 transition text-sm">
                  <td className="p-4 text-slate-800 font-medium">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                         {employee.name.charAt(0)}
                       </div>
                       {employee.name}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{employee.role}</td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {employee.phone}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{new Date(employee.joinDate).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4 text-slate-800 font-bold">{employee.salary.toFixed(2)} ج.م</td>
                  <td className="p-4 flex items-center justify-center">
                    <button onClick={() => deleteEmployee(employee.id)} className="text-rose-500 hover:bg-rose-50 transition p-2 rounded-lg" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">لا يوجد موظفين مسجلين حالياً</td>
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
              <h3 className="text-xl font-bold text-slate-800">إضافة موظف جديد</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم رباعي</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي (كاشير، عامل، مهندس..)</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input required type="tel" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الراتب الأساسي</label>
                  <input required type="number" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.salary || ''} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ التعيين</label>
                  <input required type="date" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium">حفظ بيانات الموظف</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 transition font-medium">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
