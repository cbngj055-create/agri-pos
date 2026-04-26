import React, { useState } from 'react';
import { useStore, Payment } from '../store/useStore';
import { CreditCard, Wallet, FileText, CheckCircle2, Clock, XCircle, Search, Plus } from 'lucide-react';

export default function Payments() {
  const { customers, suppliers, payments, addPayment, updatePayment } = useStore();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Payment>>({
    entityId: '',
    entityType: 'supplier',
    amount: 0,
    paymentMethod: 'cash',
    type: 'payment_out',
    notes: '',
    checkNumber: '',
    checkDate: '',
    checkStatus: 'pending'
  });

  const activeEntities = activeTab === 'suppliers' ? suppliers : customers;
  const filteredEntities = activeEntities.filter(e => e.name.includes(searchTerm) || (e.phone && e.phone.includes(searchTerm)));

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Reset selected entity when tab changes
  React.useEffect(() => {
    setSelectedEntityId(null);
  }, [activeTab]);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entityId || !formData.amount) return;

    addPayment({
      ...(formData as Payment),
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: formData.entityType === 'supplier' ? 'payment_out' : 'payment_in'
    });
    
    setIsModalOpen(false);
    setFormData({
      entityId: '',
      entityType: activeTab,
      amount: 0,
      paymentMethod: 'cash',
      type: activeTab === 'supplier' ? 'payment_out' : 'payment_in',
      notes: '',
      checkNumber: '',
      checkDate: '',
      checkStatus: 'pending'
    });
  };

  const handleUpdateCheckStatus = (paymentId: string, status: 'cleared' | 'bounced') => {
    updatePayment(paymentId, { checkStatus: status });
  };

  const relevantPayments = payments.filter(p => 
    p.entityType === (activeTab === 'suppliers' ? 'supplier' : 'customer') && 
    (selectedEntityId ? p.entityId === selectedEntityId : true)
  );

  const selectedEntityDetails = selectedEntityId ? activeEntities.find(e => e.id === selectedEntityId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">المدفوعات والديون (شيكات وآجل)</h2>
        <button 
          onClick={() => {
            setFormData({ 
              ...formData, 
              entityId: selectedEntityId || '',
              entityType: activeTab === 'suppliers' ? 'supplier' : 'customer', 
              type: activeTab === 'suppliers' ? 'payment_out' : 'payment_in' 
            });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          تسجيل دفعة جديدة
        </button>
      </div>

      <div className="flex bg-white rounded-lg p-1 border border-slate-200 w-fit">
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'suppliers' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          ديون ودفعات الموردين
        </button>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'customers' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          ديون ودفعات العملاء
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balances List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">الأرصدة الحالية ({activeTab === 'suppliers' ? 'الموردين' : 'العملاء'})</h3>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="بحث بالاسم..."
                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div 
              onClick={() => setSelectedEntityId(null)}
              className={`p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer rounded-lg mb-1 ${selectedEntityId === null ? 'bg-emerald-50 border-emerald-200' : ''}`}
            >
              <div className="font-bold text-slate-800">عرض الكل</div>
            </div>
            {filteredEntities.map(entity => (
              <div 
                key={entity.id} 
                onClick={() => setSelectedEntityId(entity.id)}
                className={`p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer rounded-lg mb-1 ${selectedEntityId === entity.id ? 'bg-emerald-50 border-emerald-200' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800">{entity.name}</span>
                  <span className={`font-bold ${entity.balance > 0 ? (activeTab === 'suppliers' ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-500'}`}>
                    {entity.balance.toFixed(2)} ج.م
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  {entity.phone}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments Ledger */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              {selectedEntityDetails ? `حركة الدفعات: ${selectedEntityDetails.name}` : 'حركة الدفعات والشيكات (الكل)'}
            </h3>
            {selectedEntityDetails && (
              <div className="text-sm">
                <span className="text-slate-500 mr-2">الرصيد المتبقي:</span>
                <span className={`font-bold ${selectedEntityDetails.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedEntityDetails.balance.toFixed(2)} ج.م
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 font-medium rounded-r-lg">التاريخ</th>
                  <th className="p-3 font-medium">الجهة</th>
                  <th className="p-3 font-medium">المبلغ</th>
                  <th className="p-3 font-medium">الطريقة</th>
                  <th className="p-3 font-medium">حالة الشيك</th>
                  <th className="p-3 font-medium rounded-l-lg text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">لا توجد حركات مسجلة</td>
                  </tr>
                ) : (
                  relevantPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">{new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                      <td className="p-3 font-bold text-slate-800">
                        {activeEntities.find(e => e.id === payment.entityId)?.name || 'غير معروف'}
                      </td>
                      <td className="p-3 font-bold text-indigo-600">{payment.amount} ج.م</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 flex items-center gap-1 w-fit rounded-md text-xs font-medium ${payment.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {payment.paymentMethod === 'cash' ? <Wallet className="w-3 h-3"/> : <FileText className="w-3 h-3"/>}
                          {payment.paymentMethod === 'cash' ? 'نقدي/حوالة' : 'شيك'}
                        </span>
                        {payment.paymentMethod === 'check' && (
                          <div className="text-xs text-slate-500 mt-1 font-mono">{payment.checkNumber}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {payment.paymentMethod === 'check' ? (
                          <span className={`px-2 py-1 flex items-center gap-1 w-fit rounded-md text-xs font-medium
                            ${payment.checkStatus === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                            ${payment.checkStatus === 'cleared' ? 'bg-emerald-100 text-emerald-800' : ''}
                            ${payment.checkStatus === 'bounced' ? 'bg-rose-100 text-rose-800' : ''}
                          `}>
                            {payment.checkStatus === 'pending' && <Clock className="w-3 h-3" />}
                            {payment.checkStatus === 'cleared' && <CheckCircle2 className="w-3 h-3" />}
                            {payment.checkStatus === 'bounced' && <XCircle className="w-3 h-3" />}
                            {payment.checkStatus === 'pending' ? 'قيد الانتظار' : payment.checkStatus === 'cleared' ? 'محصل' : 'مرتجع'}
                          </span>
                        ) : '-'}
                        {payment.paymentMethod === 'check' && payment.checkDate && (
                           <div className="text-xs text-slate-500 mt-1">تاريخ الاستحقاق: {payment.checkDate}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {payment.paymentMethod === 'check' && payment.checkStatus === 'pending' && (
                          <div className="flex items-center justify-center gap-2">
                             <button onClick={() => handleUpdateCheckStatus(payment.id, 'cleared')} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded transition" title="تحصيل وتأكيد"><CheckCircle2 className="w-4 h-4" /></button>
                             <button onClick={() => handleUpdateCheckStatus(payment.id, 'bounced')} className="text-rose-600 hover:bg-rose-50 p-1 rounded transition" title="ارتجاع"><XCircle className="w-4 h-4" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">تسجيل دفعة جديدة</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الجهة ({activeTab === 'suppliers' ? 'المورد' : 'العميل'})</label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.entityId || selectedEntityId || ''}
                  onChange={e => setFormData({...formData, entityId: e.target.value})}
                >
                  <option value="">-- اختر --</option>
                  {activeEntities.map(e => (
                    <option key={e.id} value={e.id}>{e.name} (عليه/له: {e.balance})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ القيمة (ج.م)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">طريقة الدفع</label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.paymentMethod}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                >
                  <option value="cash">نقدي / تحويل بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>

              {formData.paymentMethod === 'check' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">رقم الشيك</label>
                    <input 
                      required
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      value={formData.checkNumber}
                      onChange={e => setFormData({...formData, checkNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الاستحقاق</label>
                    <input 
                      required
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      value={formData.checkDate}
                      onChange={e => setFormData({...formData, checkDate: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات / بيان</label>
                <input 
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition">
                  حفظ الدفعة
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
