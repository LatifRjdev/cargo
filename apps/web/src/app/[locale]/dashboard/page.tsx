'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Profile {
  id: string;
  fullName: string | null;
  phone: string;
  clientCode: string | null;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Profile>('/me/profile')
      .then(setProfile)
      .catch((err) => setError(err.message || 'Ошибка загрузки профиля'))
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.fullName || user?.fullName || 'Клиент';
  const clientCode = profile?.clientCode || user?.clientCode || null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Добро пожаловать, {loading ? '...' : displayName}!
        </h1>
        {clientCode && (
          <p className="mt-1 text-sm text-gray-500">
            Ваш клиентский код: <span className="font-mono text-blue-600 font-semibold">#{clientCode}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Посылки на складе</p>
            <div className="rounded-lg bg-blue-50 p-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">&mdash;</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Коробки в пути</p>
            <div className="rounded-lg bg-amber-50 p-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">&mdash;</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Готовы к выдаче</p>
            <div className="rounded-lg bg-green-50 p-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">&mdash;</p>
        </div>
      </div>
    </div>
  );
}
