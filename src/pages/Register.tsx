import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Lock, Eye, EyeOff, LayoutDashboard, Phone, Loader2 } from 'lucide-react';
import { register } from '../services/syncService.js';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email || phone, password, storeName);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-emerald-50">
            🌱
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 font-readex">
            إنشاء حساب متجر جديد
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 font-readex">
            أو{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
              قم بتسجيل الدخول إذا كان لديك حساب
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700 font-readex cursor-pointer">اسم المتجر / الشركة</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-lg p-3 bg-slate-50 border outline-none font-readex transition"
                  placeholder="مثال: مؤسسة النور الزراعية"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 font-readex">اسم المالك</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-lg p-3 bg-slate-50 border outline-none font-readex transition"
                  placeholder="الاسم بالكامل"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 font-readex">رقم الهاتف التواصل</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-lg p-3 bg-slate-50 border outline-none font-readex transition"
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 font-readex">كلمة المرور</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pr-10 pl-10 sm:text-sm border-gray-300 rounded-lg p-3 bg-slate-50 border outline-none font-readex transition"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" /> : <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />}
                </div>
              </div>
            </div>

            <div className="flex items-center mt-2">
                <input
                  id="terms"
                  required
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="mr-2 block text-sm text-slate-900 font-readex">
                  أوافق على <a href="#" className="text-emerald-600 hover:underline">الشروط والأحكام</a>
                </label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-readex">{error}</div>
            )}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors font-readex disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutDashboard className="w-4 h-4" />}
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وبدء الاستخدام'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <Link to="/" className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors font-readex">
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
