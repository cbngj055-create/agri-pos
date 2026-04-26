import React, { useState } from 'react';
import { useStore, Prescription } from '../store/useStore';
import { FileText, Plus, Search, Trash2, Edit } from 'lucide-react';

export default function Prescriptions() {
  const { prescriptions, addPrescription, updatePrescription, deletePrescription } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Prescription>>({
    id: '',
    cropName: '',
    title: '',
    details: ''
  });

  const filtered = prescriptions.filter(p => 
    p.cropName.includes(searchTerm) || p.title.includes(searchTerm) || p.details.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cropName || !formData.title || !formData.details) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    if (isEditing && formData.id) {
      updatePrescription(formData.id, {
        cropName: formData.cropName,
        title: formData.title,
        details: formData.details
      });
    } else {
      addPrescription({
        id: Date.now().toString(),
        cropName: formData.cropName,
        title: formData.title,
        details: formData.details,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ id: '', cropName: '', title: '', details: '' });
  };

  const handleEdit = (p: Prescription) => {
    setFormData(p);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          روشتات وتوصيات المحاصيل
        </h2>
        <button 
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة روشتة جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-2.5 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ابحث باسم المحصول أو المشكلة..."
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              لا توجد روشتات مسجلة
            </div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                    {p.cropName}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-blue-600 transition" title="تعديل">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePrescription(p.id)} className="text-slate-400 hover:text-rose-600 transition" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{p.title}</h3>
                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                  {p.details}
                </p>
                <div className="mt-4 pt-3 border-t border-emerald-100 text-xs text-slate-400">
                  تم التحديث: {new Date(p.updatedAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {isEditing ? 'تعديل روشتة' : 'إضافة روشتة / توصية زراعية'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم المحصول <span className="text-rose-500">*</span></label>
                  <input 
                    required
                    list="crops-list"
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="مثال: طماطم، عنب، بطاطس..."
                    value={formData.cropName}
                    onChange={e => setFormData({...formData, cropName: e.target.value})}
                  />
                  <datalist id="crops-list">
                    {Array.from(new Set(prescriptions.map(p => p.cropName))).map(crop => (
                      <option key={crop} value={crop} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع المشكلة / التوصية <span className="text-rose-500">*</span></label>
                  <input 
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="مثال: مكافحة الندوة المتأخرة، برنامج تسميد"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تفاصيل الروشتة (الأدوية، الجرعات، التوقيت) <span className="text-rose-500">*</span></label>
                <textarea 
                  required
                  rows={8}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="اكتب التوصيات بالتفصيل هنا..."
                  value={formData.details}
                  onChange={e => setFormData({...formData, details: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition">
                  {isEditing ? 'حفط التعديلات' : 'حفظ الروشتة'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition">
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
