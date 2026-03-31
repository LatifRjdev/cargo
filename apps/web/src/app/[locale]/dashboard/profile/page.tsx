'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface Profile {
  id: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  clientCode: string | null;
  language: string;
  homeWarehouseId: string | null;
}

interface Warehouse {
  id: string;
  name: string;
  type: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('RU');
  const [homeWarehouseId, setHomeWarehouseId] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<Profile>('/me/profile'),
      apiFetch<Warehouse[]>('/warehouses'),
    ]).then(([prof, wh]) => {
      setProfile(prof);
      setWarehouses(Array.isArray(wh) ? wh : []);
      setFullName(prof.fullName || '');
      setEmail(prof.email || '');
      setLanguage(prof.language || 'RU');
      setHomeWarehouseId(prof.homeWarehouseId || '');
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          email: email.trim() || null,
          language,
          homeWarehouseId: homeWarehouseId || null,
        }),
      });
      setSuccess('Профиль сохранён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  const initials = (fullName || user?.phone || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200/50">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </span>
          Мой профиль
        </h1>
        <p className="mt-1 text-sm text-slate-500 ml-[52px]">Управление личными данными</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Avatar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold shadow-lg shadow-blue-200/30">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{fullName || profile?.phone}</p>
            <p className="text-sm text-slate-500">{profile?.phone}</p>
            {profile?.clientCode && (
              <p className="mt-1 text-sm font-mono text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-lg">{profile.clientCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Личные данные</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ФИО</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Введите полное имя"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Язык</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
              <option value="RU">Русский</option>
              <option value="TG">Тоҷикӣ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Домашний склад</label>
            <select value={homeWarehouseId} onChange={(e) => setHomeWarehouseId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
              <option value="">Не выбран</option>
              {warehouses.filter(w => w.type === 'ORIGIN').map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200 transition-all">
            {saving ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{t.common.saving}</span>
            ) : t.common.save}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Телефон</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{profile?.phone}</p>
          <p className="text-xs text-slate-400 mt-1">Изменить нельзя</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-indigo-500 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Клиент-код</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{profile?.clientCode || '—'}</p>
          <p className="text-xs text-slate-400 mt-1">Ваш уникальный идентификатор</p>
        </div>
      </div>
    </div>
  );
}
