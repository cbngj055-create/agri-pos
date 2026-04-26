import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Truck, ShoppingCart } from 'lucide-react';

export default function Purchases() {
  const { products, suppliers, addPurchase, purchases } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cart, setCart] = useState<{product: any, qty: number, buyPrice: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({ name: '', phone: '', company: '' });

  const term = searchTerm.toLowerCase();
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term))
  );
  const total = cart.reduce((sum, item) => sum + (item.buyPrice * item.qty), 0);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1, buyPrice: product.purchasePrice }];
    });
  };

  const processPurchase = () => {
    if (cart.length === 0) return alert('الفاتورة فارغة');
    if (!selectedSupplier) return alert('يجب اختيار المورد');
    
    addPurchase({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart.map(i => ({ productId: i.product.id, quantity: i.qty, price: i.buyPrice })),
      total,
      supplierId: selectedSupplier,
      type: 'credit', // Usually purchases from suppliers are credit or tracked in balance
      paidAmount: paidAmount === '' ? 0 : paidAmount
    });
    
    setCart([]);
    setPaidAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">المشتريات والموردين</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          فاتورة مشتريات جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">سجل فواتير المشتريات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="p-4 font-medium text-slate-600">رقم الفاتورة</th>
                <th className="p-4 font-medium text-slate-600">التاريخ</th>
                <th className="p-4 font-medium text-slate-600">المورد</th>
                <th className="p-4 font-medium text-slate-600">القيمة الإجمالية</th>
                <th className="p-4 font-medium text-slate-600">عدد الأصناف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((purchase) => {
                const supplier = suppliers.find(s => s.id === purchase.supplierId);
                return (
                  <tr key={purchase.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-800 font-mono text-sm">#{purchase.id.slice(-6)}</td>
                    <td className="p-4 text-slate-800">{new Date(purchase.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4 text-slate-800 font-medium">{supplier?.name || 'غير معروف'}</td>
                    <td className="p-4 text-emerald-600 font-bold">{purchase.total} ج.م</td>
                    <td className="p-4 text-slate-500">{purchase.items.length} أصناف</td>
                  </tr>
                );
              })}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد فواتير مشتريات حتى الآن</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
                إنشاء فاتورة مشتريات (إضافة للمخزون)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800">إغلاق</button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
              {/* Product Selector */}
              <div className="w-full lg:w-1/2 border-l border-slate-200 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="ابحث لاختيار صنف..." 
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none hover:border-slate-400 transition"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchTerm.trim() !== '') {
                              const exactMatch = products.find(p => p.barcode === searchTerm.trim());
                              if (exactMatch) addToCart(exactMatch);
                              else if (filteredProducts.length === 1) addToCart(filteredProducts[0]);
                          }
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => addToCart(product)}
                      className="border border-slate-200 rounded-2xl p-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition"
                    >
                      <div className="font-bold text-slate-800 text-sm">{product.name}</div>
                      <div className="text-xs text-slate-500 mt-1">سعر الشراء الحالي: {product.purchasePrice}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Form */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">المورد</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2.5 outline-none hover:border-slate-400 focus:ring-2 focus:ring-emerald-500 transition" 
                      value={selectedSupplier} 
                      onChange={e => setSelectedSupplier(e.target.value)}
                    >
                      <option value="">اختر المورد...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                    </select>
                    <button 
                      onClick={() => setIsAddSupplierModalOpen(true)}
                      className="bg-emerald-100 text-emerald-700 px-3 rounded-xl hover:bg-emerald-200 transition shrink-0 flex items-center justify-center border border-emerald-200"
                      title="إضافة مورد جديد"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex-1 font-medium text-slate-800">{item.product.name}</div>
                      <div className="w-24">
                        <label className="text-xs text-slate-500 block">الكمية</label>
                        <input 
                          type="number" 
                          min="1"
                          className="w-full border border-slate-300 rounded p-1 text-center" 
                          value={item.qty}
                          onChange={e => setCart(cart.map(i => i.product.id === item.product.id ? { ...i, qty: Number(e.target.value) } : i))}
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-slate-500 block">سعر الوحدة</label>
                        <input 
                          type="number" 
                          className="w-full border border-slate-300 rounded p-1 text-center" 
                          value={item.buyPrice}
                          onChange={e => setCart(cart.map(i => i.product.id === item.product.id ? { ...i, buyPrice: Number(e.target.value) } : i))}
                        />
                      </div>
                      <div className="w-20 text-left font-bold pt-4 text-emerald-600">
                        {item.qty * item.buyPrice}
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                       <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                       <p>اختر أصنافاً من القائمة لإضافتها לפاتورة المشتريات</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2 text-lg">
                    <span className="font-bold text-slate-700">إجمالي الفاتورة:</span>
                    <span className="font-bold text-emerald-600 text-2xl">{total.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-slate-600">المبلغ المدفوع (نقداً/الآن):</span>
                    <input 
                      type="number"
                      className="w-32 border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500 text-center font-bold"
                      placeholder="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-rose-600 font-bold">المتبقي (آجل):</span>
                    <span className="font-bold text-rose-600">{Math.max(0, total - (paidAmount || 0)).toFixed(2)} ج.م</span>
                  </div>
                  <button 
                    onClick={processPurchase}
                    disabled={cart.length === 0 || !selectedSupplier}
                    className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    حفظ الفاتورة وتحديث المخزون
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Supplier Modal */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">إضافة مورد جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المورد</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={supplierFormData.name}
                  onChange={e => setSupplierFormData({...supplierFormData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الشركة (اختياري)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={supplierFormData.company}
                  onChange={e => setSupplierFormData({...supplierFormData, company: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={supplierFormData.phone}
                  onChange={e => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    if (!supplierFormData.name) {
                        alert('يرجى إدخال اسم المورد');
                        return;
                    }
                    const id = Date.now().toString();
                    useStore.getState().addSupplier({ id, name: supplierFormData.name, phone: supplierFormData.phone || '', company: supplierFormData.company || 'فردي', balance: 0 });
                    setSelectedSupplier(id);
                    setIsAddSupplierModalOpen(false);
                    setSupplierFormData({ name: '', phone: '', company: '' });
                  }}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition"
                >
                  حفظ واختيار
                </button>
                <button 
                  onClick={() => {
                    setIsAddSupplierModalOpen(false);
                    setSupplierFormData({ name: '', phone: '', company: '' });
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
