import React, { useState, useEffect } from 'react';
import { Save, Server, Printer, Building2, Store, Cloud, CloudOff, RefreshCw, AlertTriangle, LogOut } from 'lucide-react';
import { subscribeToSyncState, performFullSync, setApiUrl, getApiUrl, logout, SyncState } from '../services/syncService.js';
import { getSyncMeta, setSyncMeta } from '../db/database.js';
import { useNavigate } from 'react-router-dom';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function Settings() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [pinEnabled, setPinEnabledState] = useState(getSyncMeta('pin_enabled') === '1');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle', lastSyncAt: 0, pendingCount: 0, conflictCount: 0, error: null, isOnline: navigator.onLine,
  });

  useEffect(() => {
    const unsub = subscribeToSyncState(setSyncState);
    return unsub;
  }, []);

  useEffect(() => {
    const existingStoreName = getSyncMeta('store_name');
    const existingPhone = getSyncMeta('store_phone');
    const existingAddress = getSyncMeta('store_address');
    const existingTaxRate = getSyncMeta('tax_rate');
    const existingReceiptFooter = getSyncMeta('receipt_footer');

    setStoreName(existingStoreName || '');
    setPhone(existingPhone || '');
    setAddress(existingAddress || '');
    setTaxRate(existingTaxRate || '0');
    setReceiptFooter(existingReceiptFooter || '');
  }, []);

  const saveTimerRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      setSyncMeta('store_name', storeName);
      setSyncMeta('store_phone', phone);
      setSyncMeta('store_address', address);
      setSyncMeta('tax_rate', taxRate || '0');
      setSyncMeta('receipt_footer', receiptFooter);
      setIsSaved(true);
      window.setTimeout(() => setIsSaved(false), 1500);
    }, 600);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [storeName, phone, address, taxRate, receiptFooter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    setSyncMeta('store_name', storeName);
    setSyncMeta('store_phone', phone);
    setSyncMeta('store_address', address);
    setSyncMeta('tax_rate', taxRate || '0');
    setSyncMeta('receipt_footer', receiptFooter);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleApiUrlSave = () => {
    setApiUrl(apiUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const savePin = async () => {
    setPinErr('');
    setPinMsg('');

    const cleanPin = pin.replace(/\D/g, '').slice(0, 4);
    const cleanConfirm = pinConfirm.replace(/\D/g, '').slice(0, 4);

    if (cleanPin.length !== 4) {
      setPinErr('الرقم السري يجب أن يكون 4 أرقام');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setPinErr('تأكيد الرقم السري غير مطابق');
      return;
    }

    const hashed = await sha256(cleanPin);
    setSyncMeta('pin_hash', hashed);
    setSyncMeta('pin_enabled', '1');
    setPinEnabledState(true);
    setPin('');
    setPinConfirm('');
    setPinMsg('تم حفظ الرقم السري');
    setTimeout(() => setPinMsg(''), 3000);
  };

  const togglePinEnabled = (enabled: boolean) => {
    setPinErr('');
    setPinMsg('');

    if (enabled) {
      const hasHash = Boolean(getSyncMeta('pin_hash'));
      if (!hasHash) {
        setPinErr('لا يوجد رقم سري محفوظ. قم بتعيين رقم سري أولاً.');
        setPinEnabledState(false);
        return;
      }
      setSyncMeta('pin_enabled', '1');
      setPinEnabledState(true);
    } else {
      setSyncMeta('pin_enabled', '0');
      setPinEnabledState(false);
      sessionStorage.removeItem('pin_unlocked');
    }
  };

  const lockNow = () => {
    sessionStorage.removeItem('pin_unlocked');
    setPinMsg('تم قفل النظام، سيتم طلب الرقم السري عند العودة للوحة');
    setTimeout(() => setPinMsg(''), 3000);
  };

  const formatLastSync = (ts: number) => {
    if (!ts) return 'لم تتم بعد';
    return new Date(ts * 1000).toLocaleString('ar-EG');
  };

  const syncStatusColor = () => {
    if (!syncState.isOnline) return 'text-gray-400';
    switch (syncState.status) {
      case 'synced': return 'text-green-500';
      case 'pushing': case 'pulling': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return syncState.pendingCount > 0 ? 'text-yellow-500' : 'text-gray-400';
    }
  };

  const syncStatusLabel = () => {
    if (!syncState.isOnline) return 'بدون إنترنت';
    switch (syncState.status) {
      case 'synced': return 'متزامن ✅';
      case 'pushing': return 'جاري الرفع...';
      case 'pulling': return 'جاري التحميل...';
      case 'error': return `خطأ: ${syncState.error}`;
      default: return syncState.pendingCount > 0 ? `${syncState.pendingCount} تعديل معلق` : 'جاهز';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-800">الإعدادات العامة</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50 text-slate-800">
              <Store className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg">بيانات المتجر الأساسية</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم المتجر / الشركة</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" 
                    value={storeName} 
                    onChange={e => setStoreName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم هاتف التواصل</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">عنوان المتجر (يظهر في הפاتورة)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" 
                    value={taxRate} 
                    onChange={e => setTaxRate(e.target.value === '' ? '0' : e.target.value)} 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">تذييل إيصال المبيعات الحراري</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" 
                    rows={2}
                    value={receiptFooter} 
                    onChange={e => setReceiptFooter(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {isSaved ? (
                <span className="text-emerald-600 font-medium text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  تم حفظ الإعدادات بنجاح
                </span>
              ) : <span></span>}
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium shadow-sm">
                <Save className="w-4 h-4" />
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <div className="flex items-center gap-3 mb-4 text-slate-800">
              <Cloud className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold">المزامنة والسيرفر</h3>
             </div>
             <div className="space-y-3 mb-4">
               <div className="flex items-center justify-between">
                 <span className="text-sm text-slate-500">الحالة:</span>
                 <span className={`text-sm font-medium ${syncStatusColor()}`}>{syncStatusLabel()}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm text-slate-500">آخر مزامنة:</span>
                 <span className="text-sm text-slate-700">{formatLastSync(syncState.lastSyncAt)}</span>
               </div>
               {syncState.conflictCount > 0 && (
                 <div className="flex items-center gap-2 text-orange-600 text-sm">
                   <AlertTriangle className="w-4 h-4" />
                   <span>{syncState.conflictCount} تعارض</span>
                 </div>
               )}
             </div>
             <div className="space-y-2 mb-4">
               <label className="block text-sm font-medium text-slate-700">عنوان السيرفر</label>
               <input
                 type="text"
                 dir="ltr"
                 className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                 value={apiUrl}
                 onChange={(e) => setApiUrlState(e.target.value)}
                 placeholder="http://localhost:3001"
               />
               <button onClick={handleApiUrlSave} className="w-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 py-2 rounded-lg text-sm font-medium transition">
                 حفظ عنوان السيرفر
               </button>
             </div>
             <div className="space-y-2">
               <button
                 onClick={() => performFullSync()}
                 disabled={!syncState.isOnline || syncState.status === 'pushing' || syncState.status === 'pulling'}
                 className="w-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 <RefreshCw className={`w-4 h-4 ${syncState.status === 'pushing' || syncState.status === 'pulling' ? 'animate-spin' : ''}`} />
                 مزامنة الآن
               </button>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <div className="flex items-center gap-3 mb-4 text-slate-800">
              <Server className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold">قاعدة البيانات المحلية</h3>
             </div>
             <p className="text-sm text-slate-500 mb-4 leading-relaxed">
               بياناتك يتم حفظها محلياً في SQLite وتبقى متاحة بدون إنترنت. عند الاتصال، تتم المزامنة تلقائياً.
             </p>
             <div className="space-y-2">
               <button type="button" className="w-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg text-sm font-medium transition">
                 حفظ نسخة احتياطية (تصدير)
               </button>
               <button type="button" className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-lg text-sm font-medium transition">
                 استعادة بيانات (استيراد)
               </button>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <div className="flex items-center gap-3 mb-4 text-slate-800">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold">الأمان (PIN أوفلاين)</h3>
             </div>
             <p className="text-sm text-slate-500 mb-4 leading-relaxed">
               يمكنك تفعيل قفل برقم سري 4 أرقام عند فتح التطبيق. يعمل بدون إنترنت.
             </p>

             <div className="space-y-3">
               <label className="flex items-center justify-between gap-3 cursor-pointer">
                 <span className="text-sm text-slate-700">تفعيل قفل PIN</span>
                 <input
                   type="checkbox"
                   className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                   checked={pinEnabled}
                   onChange={(e) => togglePinEnabled(e.target.checked)}
                 />
               </label>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">رقم سري جديد</label>
                   <input
                     type="password"
                     inputMode="numeric"
                     maxLength={4}
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                     value={pin}
                     onChange={(e) => {
                       setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                       setPinErr('');
                       setPinMsg('');
                     }}
                     placeholder="1234"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد</label>
                   <input
                     type="password"
                     inputMode="numeric"
                     maxLength={4}
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                     value={pinConfirm}
                     onChange={(e) => {
                       setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4));
                       setPinErr('');
                       setPinMsg('');
                     }}
                     placeholder="1234"
                   />
                 </div>
               </div>

               {pinErr && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{pinErr}</div>}
               {pinMsg && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg">{pinMsg}</div>}

               <div className="grid grid-cols-2 gap-2">
                 <button
                   type="button"
                   onClick={() => void savePin()}
                   className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 py-2 rounded-lg text-sm font-medium transition"
                 >
                   حفظ PIN
                 </button>
                 <button
                   type="button"
                   onClick={lockNow}
                   className="w-full bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 py-2 rounded-lg text-sm font-medium transition"
                 >
                   قفل الآن
                 </button>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <div className="flex items-center gap-3 mb-4 text-slate-800">
              <Printer className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold">تفضيلات الطباعة</h3>
             </div>
             <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                  <span className="text-sm text-slate-700">طباعة الفاتورة تلقائياً بعد الشراء</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                  <span className="text-sm text-slate-700">عرض شعار المتجر في الطباعة</span>
                </label>
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <span className="text-xs text-slate-400">لإعداد طابعة باركود مخصصة، يرجى مراجعة الدليل المصاحب للنظام.</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
