'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('+992');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t, locale } = useI18n();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(phone);
      setStep(2);
    } catch (err: any) {
      setError(err.message || t.auth.sendCodeError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.verifyOtp(phone, code);
      login(result.accessToken, result.refreshToken, result.user);
      const role = result.user.role;
      if (role === 'ADMIN') router.push(`/${locale}/admin`);
      else if (role === 'WAREHOUSE_WORKER') router.push(`/${locale}/warehouse`);
      else router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || t.auth.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border border-white/30" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white/20" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <span className="text-2xl font-bold text-white">Cargo</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            {t.auth.heroTitle.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-md">
            {t.auth.heroDesc}
          </p>
          <div className="mt-12 flex gap-8">
            {[
              { value: '3', label: t.auth.warehouses },
              { value: '24/7', label: t.auth.support },
              { value: '$6', label: t.auth.priceFrom },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-blue-200 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <span className="text-xl font-bold text-slate-900">Cargo</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              {step === 1 ? t.auth.login : t.auth.confirmation}
            </h1>
            <p className="text-slate-500 mt-2">
              {step === 1 ? t.auth.loginSubtitle : `${t.auth.codeSentTo} ${phone}`}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className={`flex-1 h-0.5 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">{t.auth.phone}</label>
                <div className="relative">
                  <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <input
                    id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.auth.phonePlaceholder}
                    className="w-full rounded-xl border border-slate-200 pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{t.common.sending}</span>
                ) : t.auth.getCode}
              </button>
              <p className="text-center text-sm text-slate-500">
                {t.auth.noAccount}{' '}
                <Link href={`/${locale}/register`} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">{t.auth.registerLink}</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">{t.auth.otp}</label>
                <input
                  id="code" type="text" inputMode="numeric" maxLength={4} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus required
                />
                <p className="mt-3 text-xs text-slate-400 text-center">{t.auth.devCode} <span className="font-mono font-semibold text-slate-600">0000</span></p>
              </div>
              <button type="submit" disabled={loading || code.length !== 4} className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{t.common.checking}</span>
                ) : t.auth.confirmBtn}
              </button>
              <button type="button" onClick={() => { setStep(1); setCode(''); setError(''); }} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                {t.auth.changeNumber}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-10">
            Cargo Consolidation System
          </p>
        </div>
      </div>
    </div>
  );
}
