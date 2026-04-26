import React, { useState, useRef } from 'react';
import { useStore, Product } from '../store/useStore';
import { Search, Plus, Minus, Trash2, Printer, Save, ShoppingCart, FileText } from 'lucide-react';

interface CartItem {
  product: Product;
  qty: number;
}

export default function Invoice() {
  const { products, addSale, customers } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '' });
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter products for smart search dropdown
  const searchResults = products.filter(p => {
    if (searchTerm.trim() === '') return true;
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term));
  }).slice(0, 15); // Show up to 15 products

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('هذا الصنف غير متوفر في المخزون!');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('الكمية المطلوبة تتجاوز المخزون المتاح!');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = item.qty + delta;
        if (newQty < 1) return item;
        if (newQty > item.product.stock) {
          alert('الكمية المطلوبة تتجاوز المخزون المتاح!');
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.qty), 0);
  
  let calculatedDiscount = 0;
  if (discountType === 'percentage') {
    calculatedDiscount = subtotal * (discount / 100);
  } else {
    calculatedDiscount = discount;
  }
  
  const total = Math.max(0, subtotal - calculatedDiscount);

  const handleCheckout = (print: boolean = false) => {
    if (cart.length === 0) return;

    if (paymentType === 'cash') {
      const paid = paidAmount === '' ? total : paidAmount; // Default fully paid if cash
      if (paid < total) {
        alert('المبلغ المدفوع أقل من إجمالي الفاتورة!');
        return;
      }
    }

    // Process Sale
    const saleData = {
      id: Date.now().toString(),
      items: cart,
      total,
      date: new Date().toISOString(),
      customerId: selectedCustomer || undefined,
      type: paymentType,
      paidAmount: paymentType === 'cash' ? (paidAmount === '' ? total : paidAmount) : (paidAmount === '' ? 0 : paidAmount)
    };

    addSale(saleData);

    if (print) {
      window.print();
    } else {
        alert('تم حفظ الفاتورة بنجاح!');
    }

    // Reset
    setCart([]);
    setPaidAmount('');
    setDiscount(0);
    setSearchTerm('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 print:block print:space-y-0 print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            فاتورة مبيعات محاسبية
        </h2>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible print:border-none print:shadow-none print:bg-transparent">
         
         {/* Top Header Section */}
         <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start gap-6 bg-slate-50 rounded-t-2xl print:hidden">
            {/* Invoice Info */}
            <div className="space-y-3 w-full md:w-1/3">
                <h3 className="text-xl font-bold text-slate-800">بيانات الفاتورة</h3>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">رقم التسلسل:</span>
                        <span className="font-mono font-bold text-slate-800">#{Date.now().toString().slice(-6)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-500 text-sm">طريقة الدفع:</span>
                        <select 
                            className="border border-slate-200 rounded-lg p-1.5 text-sm font-medium outline-none focus:border-emerald-500 bg-slate-50"
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value as 'cash' | 'credit')}
                        >
                            <option value="cash">نقدي (كاش)</option>
                            <option value="credit">آجل على الحساب</option>
                        </select>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">التاريخ:</span>
                        <span className="font-medium text-slate-700">{new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
            </div>
            
            {/* Customer Info */}
            <div className="w-full md:w-1/3">
                <h3 className="text-xl font-bold text-slate-800 mb-3">بيانات العميل</h3>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">حساب العميل (اختياري)</label>
                <div className="flex gap-2">
                  <select 
                      className="w-full border border-slate-300 rounded-xl p-3 bg-white outline-none hover:border-slate-400 focus:ring-2 focus:ring-emerald-500 transition shadow-sm" 
                      value={selectedCustomer} 
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                    >
                      <option value="">عميل نقدي سريع</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    onClick={() => setIsAddCustomerModalOpen(true)}
                    className="bg-emerald-100 text-emerald-700 px-3 rounded-xl hover:bg-emerald-200 transition shrink-0 flex items-center justify-center border border-emerald-200"
                    title="إضافة عميل جديد"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {selectedCustomer && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm">
                        <p className="font-bold text-slate-800 text-base">{customers.find(c => c.id === selectedCustomer)?.name}</p>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">☎</span>
                            {customers.find(c => c.id === selectedCustomer)?.phone}
                        </p>
                    </div>
                )}
            </div>
         </div>

         {/* Items Table Section */}
         <div className="p-0 sm:p-6 print:hidden">
            <div className="border border-slate-200 rounded-xl overflow-visible shadow-sm">
                <table className="w-full text-right bg-white">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 text-sm">
                        <tr>
                            <th className="p-4 font-medium w-16 text-center">م</th>
                            <th className="p-4 font-medium">البيان / الصنف</th>
                            <th className="p-4 font-medium w-32">سعر الوحدة</th>
                            <th className="p-4 font-medium w-32">الكمية</th>
                            <th className="p-4 font-medium w-32">الإجمالي</th>
                            <th className="p-4 font-medium w-16 text-center">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cart.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <div className="inline-flex flex-col items-center justify-center text-slate-400">
                                        <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                        <p>لم يتم إدراج أي أصناف في مقايسة الفاتورة</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {cart.map((item, idx) => (
                            <tr key={item.product.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-center text-slate-400 font-mono text-sm">{idx + 1}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800 text-base">{item.product.name}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5 tracking-wider">{item.product.barcode}</div>
                                </td>
                                <td className="p-4 text-slate-600 font-medium">{item.product.salePrice.toFixed(2)}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 w-24 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                                        <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded transition"><Plus className="w-4 h-4" /></button>
                                        <span className="flex-1 text-center font-bold text-slate-800">{item.qty}</span>
                                        <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded transition"><Minus className="w-4 h-4" /></button>
                                    </div>
                                </td>
                                <td className="p-4 font-black text-slate-800">{(item.product.salePrice * item.qty).toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        
                        {/* Smart Item Entry Row */}
                        <tr className="bg-emerald-50/30">
                            <td className="p-4 text-center text-emerald-500"><Plus className="w-5 h-5 mx-auto" /></td>
                            <td colSpan={5} className="p-3 relative">
                                <div className="relative flex items-center max-w-lg">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input 
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="ابحث لاختيار صنف للإضافة (باركود أو اسم)..."
                                        className="w-full bg-white border-2 border-emerald-100 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none hover:border-emerald-300 transition shadow-sm text-slate-800 font-medium"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && searchTerm.trim() !== '') {
                                                const exactMatch = products.find(p => p.barcode === searchTerm.trim());
                                                if (exactMatch) addToCart(exactMatch);
                                                else if (searchResults.length === 1) addToCart(searchResults[0]);
                                            }
                                        }}
                                    />
                                </div>
                                
                                {/* Smart Search Dropdown */}
                                {isSearchFocused && searchResults.length > 0 && (
                                    <div className="absolute top-[85%] mt-2 right-3 w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto overflow-hidden">
                                        {searchResults.map((product, i) => (
                                            <div 
                                                key={product.id}
                                                onMouseDown={(e) => { e.preventDefault(); addToCart(product); }}
                                                className={`flex items-center justify-between p-4 cursor-pointer transition ${i !== searchResults.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-emerald-50`}
                                            >
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg">{product.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-1">{product.barcode}</div>
                                                </div>
                                                <div className="text-left bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="text-emerald-700 font-black">{product.salePrice.toFixed(2)} ج.م</div>
                                                    <div className={`text-[10px] mt-0.5 font-bold ${product.stock > 0 ? 'text-slate-400' : 'text-rose-500'}`}>
                                                        الرصيد: {product.stock}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
         </div>

         {/* Footer Summary & Actions */}
         <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl print:hidden flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            
            {/* Discount & Extras Options */}
            <div className="w-full lg:w-1/3 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 mb-3">حسم / خصم إضافي للفاتورة</label>
                    <div className="flex items-center gap-3">
                        <select 
                            className="w-1/3 border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 transition"
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                        >
                            <option value="fixed">مبلغ (ج.م)</option>
                            <option value="percentage">نسبة (%)</option>
                        </select>
                        <input 
                            type="number"
                            min="0"
                            className="flex-1 border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition font-mono text-lg font-bold text-slate-800 placeholder:text-slate-300"
                            value={discount || ''}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* Totals & Submit */}
            <div className="w-full lg:w-1/2 flex flex-col items-end">
                 <div className="w-full max-w-sm space-y-3 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center text-slate-600 text-sm font-medium">
                        <span>قيمة البضاعة:</span>
                        <span className="font-bold text-base">{subtotal.toFixed(2)} ج.م</span>
                    </div>
                    {calculatedDiscount > 0 && (
                        <div className="flex justify-between items-center text-rose-600 text-sm font-medium">
                            <span className="bg-rose-50 px-2 py-0.5 rounded text-xs">مبلغ الخصم</span>
                            <span className="font-bold text-base">-{calculatedDiscount.toFixed(2)} ج.م</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xl pt-4 border-t border-slate-100 font-medium text-slate-800 mt-2">
                        <span>الصافي المطلوب:</span>
                        <span className="text-emerald-600 text-3xl font-black">{total.toFixed(2)} <span className="text-sm font-medium text-emerald-600/70">ج.م</span></span>
                    </div>
                    {paymentType === 'credit' && (
                       <div className="space-y-3 pt-4 border-t border-slate-100">
                         <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600 text-sm">المدفوع الآن (مقدم):</span>
                            <input 
                                type="number"
                                className="w-28 border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500 text-center font-bold text-sm"
                                placeholder="0"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-rose-600 font-bold">المتبقي (آجل):</span>
                            <span className="font-bold text-rose-600">{Math.max(0, total - (paidAmount || 0)).toFixed(2)} ج.م</span>
                         </div>
                       </div>
                    )}
                </div>

                <div className="w-full max-w-sm flex gap-3">
                   <button 
                     onClick={() => handleCheckout(false)}
                     disabled={cart.length === 0}
                     className="flex-[1] bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2 disabled:border-slate-100 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                   >
                     <Save className="w-5 h-5" />
                     حفظ
                   </button>
                   <button 
                     onClick={() => handleCheckout(true)}
                     disabled={cart.length === 0}
                     className="flex-[2] bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                   >
                     <Printer className="w-5 h-5" />
                     ترحيل المبيعات والطباعة
                   </button>
                </div>
            </div>
         </div>
      </div>

      {/* Actual Print Layout (Rendered only during window.print()) */}
      <div className="hidden print:block mb-8 pb-6 border-b-2 border-slate-800 print:text-black">
          <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-4xl font-black mb-4 text-slate-800 tracking-tight">فاتورة مبيعات</h1>
                  <div className="space-y-1 text-slate-800">
                      <p><span className="font-bold w-24 inline-block">رقم الفاتورة:</span> <span className="font-mono">#{Date.now().toString().slice(-6)}</span></p>
                      <p><span className="font-bold w-24 inline-block">التاريخ:</span> {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}</p>
                      <p><span className="font-bold w-24 inline-block">طريقة الدفع:</span> {paymentType === 'cash' ? 'نقدي' : 'آجل'}</p>
                  </div>
              </div>
              <div className="text-left">
                  <h2 className="text-3xl font-black text-slate-800">النظام الزراعي</h2>
                  <p className="text-slate-600 font-medium mt-1">القاهرة - طريق مصر الزراعي</p>
                  <p className="text-slate-600 font-medium">س.ت: 123456 | ب.ض: 789-012-345</p>
                  <p className="text-slate-600 font-bold mt-1">تليفون: 01012345678</p>
                  {selectedCustomer && (
                      <div className="mt-6 p-4 border border-slate-300 rounded-lg bg-slate-50 text-right">
                          <p className="text-sm font-bold text-slate-500 mb-1">فاتورة إلى العميل:</p>
                          <p className="font-black text-xl text-slate-800">{customers.find(c => c.id === selectedCustomer)?.name}</p>
                          <p className="font-medium text-slate-600 mt-1 flex items-center justify-end gap-2 text-left" dir="ltr">
                              {customers.find(c => c.id === selectedCustomer)?.phone}
                          </p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="hidden print:block">
          <table className="w-full text-right mb-4 border-collapse">
              <thead className="bg-slate-100 text-slate-800 border-y-2 border-slate-800">
                  <tr>
                      <th className="p-3 font-bold w-12 text-center border-l border-slate-300">م</th>
                      <th className="p-3 font-bold border-l border-slate-300">وصف الصنف / البيان</th>
                      <th className="p-3 font-bold w-32 border-l border-slate-300">سعر الوحدة</th>
                      <th className="p-3 font-bold w-24 border-l border-slate-300">الكمية</th>
                      <th className="p-3 font-bold w-32">الإجمالي</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                  {cart.map((item, idx) => (
                      <tr key={item.product.id} className="text-base text-slate-800">
                          <td className="p-3 text-center border-l border-slate-300">{idx + 1}</td>
                          <td className="p-3 font-bold border-l border-slate-300">
                              {item.product.name}
                              {item.product.barcode && <span className="block text-sm font-normal text-slate-600 font-mono mt-0.5">{item.product.barcode}</span>}
                          </td>
                          <td className="p-3 border-l border-slate-300">{item.product.salePrice.toFixed(2)}</td>
                          <td className="p-3 font-bold text-center border-l border-slate-300">{item.qty}</td>
                          <td className="p-3 font-black">{(item.product.salePrice * item.qty).toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
      
      {/* Print Footer Summary */}
      <div className="hidden print:block pt-8 break-inside-avoid">
          <div className="flex justify-between items-start">
              <div className="w-1/2 text-sm text-slate-600 border border-slate-300 p-4 rounded-lg bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-2">تعليمات وملاحظات:</h4>
                  <ul className="list-disc list-inside space-y-1">
                      <li>البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم من تاريخ الفاتورة.</li>
                      <li>يرجى مراجعة الأصناف والكميات قبل مغادرة المخزن.</li>
                      <li>الضمان يسري فقط مع إرفاق أصل هذه الفاتورة.</li>
                  </ul>
              </div>
              <div className="w-[40%] space-y-0 text-slate-800 border-2 border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-slate-300 bg-white">
                      <span className="font-bold text-slate-600">الإجمالي قبل الخصم</span>
                      <span className="font-bold">{subtotal.toFixed(2)}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                      <div className="flex justify-between items-center p-3 border-b border-slate-300 bg-white">
                          <span className="font-bold text-slate-600">قيمة الخصم</span>
                          <span className="font-bold text-slate-800">{calculatedDiscount.toFixed(2)}</span>
                      </div>
                  )}
                  <div className="flex justify-between items-center p-4 bg-slate-100 text-xl font-black">
                      <span>الصافي المطلوب دفعه</span>
                      <span>{total.toFixed(2)} <span className="text-sm font-bold">ج.م</span></span>
                  </div>
              </div>
          </div>
          
          <div className="flex justify-between mt-24 text-slate-800 text-center text-lg">
              <div className="w-1/3 border-t-2 border-slate-400 pt-3 mx-4">
                  <p className="font-bold">توقيع المستلم / العميل</p>
              </div>
              <div className="w-1/3 border-t-2 border-slate-400 pt-3 mx-4">
                  <p className="font-bold">البائع / أمين الخزينة</p>
              </div>
              <div className="w-1/3 border-t-2 border-slate-400 pt-3 mx-4">
                  <p className="font-bold">إعتماد الإدارة المباعة</p>
              </div>
          </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">إضافة عميل جديد للآجل</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={customerFormData.name}
                  onChange={e => setCustomerFormData({...customerFormData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={customerFormData.phone}
                  onChange={e => setCustomerFormData({...customerFormData, phone: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    if (!customerFormData.name) {
                        alert('يرجى إدخال اسم العميل');
                        return;
                    }
                    const id = Date.now().toString();
                    useStore.getState().addCustomer({ id, name: customerFormData.name, phone: customerFormData.phone || '', address: '', balance: 0 });
                    setSelectedCustomer(id);
                    setIsAddCustomerModalOpen(false);
                    setCustomerFormData({ name: '', phone: '' });
                  }}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition"
                >
                  التالي (حفظ العميل)
                </button>
                <button 
                  onClick={() => {
                    setIsAddCustomerModalOpen(false);
                    setCustomerFormData({ name: '', phone: '' });
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
