import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '../services/syncService.js';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
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
            تسجيل الدخول للنظام
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 font-readex">
            أو{' '}
            <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
              قم بإنشاء حساب جديد لمتجرك
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700 font-readex">البريد الإلكتروني أو رقم الهاتف</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-lg p-3 bg-slate-50 border outline-none font-readex transition"
                  placeholder="name@example.com"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-slate-900 font-readex">
                  تذكرني
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors font-readex">
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-readex">{error}</div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors font-readex disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
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
