'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('+992');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(phone);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Ошибка при регистрации');
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
      if (role === 'ADMIN') {
        router.push('/ru/admin');
      } else if (role === 'WAREHOUSE_WORKER') {
        router.push('/ru/warehouse');
      } else {
        router.push('/ru/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Регистрация</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {step === 1
            ? 'Введите номер телефона для регистрации'
            : 'Введите код подтверждения'}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Номер телефона
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+992 XX XXX XXXX"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Отправка...' : 'Зарегистрироваться'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Уже есть аккаунт?{' '}
              <Link href="/ru/login" className="text-blue-600 hover:underline font-medium">
                Войти
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Код подтверждения
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-xs text-gray-400">Код отправлен на {phone}</p>
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 4}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setCode(''); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Изменить номер
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
