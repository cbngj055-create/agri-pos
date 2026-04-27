import React, { useMemo, useState } from 'react';

type Props = {
  title?: string;
  onUnlock: () => void;
  isPinValid: (pin: string) => Promise<boolean>;
};

export default function PinLock({ title, onUnlock, isPinValid }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const masked = useMemo(() => '•'.repeat(pin.length), [pin.length]);

  async function submit() {
    setError('');
    if (pin.length !== 4) {
      setError('الرجاء إدخال رقم سري 4 أرقام');
      return;
    }

    setLoading(true);
    try {
      const ok = await isPinValid(pin);
      if (!ok) {
        setError('رقم سري غير صحيح');
        return;
      }
      setPin('');
      onUnlock();
    } catch (e) {
      setError((e as Error).message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-emerald-50 mx-auto">
            🌱
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 font-readex">{title || 'أدخل الرقم السري'}</h2>
          <p className="mt-2 text-sm text-slate-600 font-readex">للدخول إلى لوحة التحكم</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 font-readex mb-1">الرقم السري (4 أرقام)</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(v);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 outline-none font-readex tracking-[0.35em] text-center"
              placeholder="••••"
              aria-label="pin"
            />
            <div className="text-center text-slate-400 mt-2 font-readex tracking-[0.35em]">{masked}</div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-readex">{error}</div>}

          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors font-readex disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </div>
      </div>
    </div>
  );
}
