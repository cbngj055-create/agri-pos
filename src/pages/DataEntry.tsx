import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, Truck, Plus, Trash2 } from 'lucide-react';

export default function DataEntry() {
  const { customers, suppliers, addCustomer, addSupplier } = useStore();
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', company: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'customers') {
      addCustomer({ id: Date.now().toString(), name: formData.name, phone: formData.phone, address: formData.address, balance: 0 });
    } else {
      addSupplier({ id: Date.now().toString(), name: formData.name, phone: formData.phone, company: formData.company, balance: 0 });
    }
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', address: '', company: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">تسجيل البيانات</h2>
        <button 
          onClick={() => { setFormData({ name: '', phone: '', address: '', company: '' }); setIsModalOpen(true); }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة {activeTab === 'customers' ? 'عميل' : 'مورد'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button 
            className={`flex-1 py-4 font-medium flex justify-center items-center gap-2 transition ${activeTab === 'customers' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users className="w-5 h-5" />
            العملاء
          </button>
          <button 
            className={`flex-1 py-4 font-medium flex justify-center items-center gap-2 transition ${activeTab === 'suppliers' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('suppliers')}
          >
            <Truck className="w-5 h-5" />
            الموردين
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 font-medium text-slate-600">الاسم</th>
                <th className="p-4 font-medium text-slate-600">رقم الهاتف</th>
                {activeTab === 'customers' ? (
                  <th className="p-4 font-medium text-slate-600">العنوان</th>
                ) : (
                  <th className="p-4 font-medium text-slate-600">الشركة</th>
                )}
                <th className="p-4 font-medium text-slate-600">الرصيد الافتتاحي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'customers' ? customers : suppliers).map((person: any) => (
                <tr key={person.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800 font-medium">{person.name}</td>
                  <td className="p-4 text-slate-500">{person.phone}</td>
                  <td className="p-4 text-slate-500">{activeTab === 'customers' ? person.address : person.company}</td>
                  <td className="p-4 font-bold text-slate-800">{person.balance} ج.م</td>
                </tr>
              ))}
              {(activeTab === 'customers' ? customers : suppliers).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">لا توجد بيانات، قم بإضافة سجل جديد للبدء</td>
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
              <h3 className="text-xl font-bold text-slate-800">إضافة {activeTab === 'customers' ? 'عميل' : 'مورد'} جديد</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input required type="tel" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              {activeTab === 'customers' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الشركة</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                </div>
              )}
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
