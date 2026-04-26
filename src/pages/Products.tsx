import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', barcode: '', purchasePrice: 0, salePrice: 0, stock: 0, category: '', unit: 'قطعة', expiryDate: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || p.barcode.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      updateProduct(formData.id, formData);
    } else {
      addProduct({ ...formData, id: Date.now().toString() });
    }
    setIsModalOpen(false);
    setFormData({ id: '', name: '', barcode: '', purchasePrice: 0, salePrice: 0, stock: 0, category: '', unit: 'قطعة', expiryDate: '' });
  };

  const openEdit = (product: any) => {
    setFormData(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">الأصناف والباركود</h2>
        <button 
          onClick={() => {
            setFormData({ id: '', name: '', barcode: '', purchasePrice: 0, salePrice: 0, stock: 0, category: '', unit: 'قطعة', expiryDate: '' });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة صنف جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="text-slate-400 w-5 h-5 ml-2" />
        <input 
          type="text"
          placeholder="ابحث باسم الصنف أو الباركود..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 font-medium text-slate-600">الباركود</th>
                <th className="p-4 font-medium text-slate-600">اسم الصنف</th>
                <th className="p-4 font-medium text-slate-600">التصنيف</th>
                <th className="p-4 font-medium text-slate-600">سعر الشراء</th>
                <th className="p-4 font-medium text-slate-600">سعر البيع</th>
                <th className="p-4 font-medium text-slate-600">الوحدة</th>
                <th className="p-4 font-medium text-slate-600">تاريخ الصلاحية</th>
                <th className="p-4 font-medium text-slate-600">المخزون</th>
                <th className="p-4 font-medium text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800 font-mono text-sm">{product.barcode}</td>
                  <td className="p-4 text-slate-800 font-medium">{product.name}</td>
                  <td className="p-4 text-slate-500">{product.category}</td>
                  <td className="p-4 text-slate-800">{product.purchasePrice} ج.م</td>
                  <td className="p-4 text-emerald-600 font-bold">{product.salePrice} ج.م</td>
                  <td className="p-4 text-slate-600 text-sm">{product.unit || 'قطعة'}</td>
                  <td className="p-4 text-slate-600 text-sm">{product.expiryDate || '-'}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${product.stock > 10 ? 'bg-emerald-100 text-emerald-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">لا توجد أصناف، أضف صنفاً جديداً للبدء</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{formData.id ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الصنف</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
                  <div className="flex">
                    <input required type="text" className="w-full border border-gray-300 rounded-r-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                    <button type="button" onClick={() => setFormData({...formData, barcode: Math.floor(Math.random() * 1000000000000).toString()})} className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 text-sm text-gray-600 hover:bg-gray-200">توليد</button>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                  <input 
                    list="category-options"
                    required 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" 
                    placeholder="اختر أو اكتب تصنيفاً..."
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                  <datalist id="category-options">
                    <option value="مبيدات" />
                    <option value="أسمدة" />
                    <option value="بذور" />
                    <option value="معدات" />
                    {Array.from(new Set(products.map(p => p.category)))
                      .filter(c => !['مبيدات', 'أسمدة', 'بذور', 'معدات'].includes(c))
                      .map(cat => (
                        <option key={cat} value={cat} />
                      ))
                    }
                  </datalist>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">وحدة القياس</label>
                  <select required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="جرام">جرام</option>
                    <option value="شيكارة">شيكارة</option>
                    <option value="لتر">لتر</option>
                    <option value="متر">متر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر الشراء</label>
                  <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.purchasePrice || ''} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
                  <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.salePrice || ''} onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value)})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزون المبدئي</label>
                  <input required type="number" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الصلاحية (اختياري)</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none transition focus:border-emerald-500 focus:ring-emerald-500" value={formData.expiryDate || ''} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium">حفظ</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
