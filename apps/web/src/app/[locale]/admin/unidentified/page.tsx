'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface UnidentifiedParcel {
  id: string;
  trackingNumber: string | null;
  phoneOnLabel: string | null;
  weightKg: string | number | null;
  description: string | null;
  status: string;
  receivedAt: string | null;
  createdAt: string;
  warehouse: { name: string } | null;
}

export default function AdminUnidentifiedPage() {
  const { t, locale } = useI18n();
  const [parcels, setParcels] = useState<UnidentifiedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignCode, setAssignCode] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/unidentified-parcels');
      setParcels(Array.isArray(res) ? res : res.items || res.data || []);
    } catch { setParcels([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchParcels(); }, []);

  const handleAssign = async (parcelId: string) => {
    if (!assignCode.trim()) return;
    setAssigning(true);
    try {
      await apiFetch(`/warehouse/parcels/${parcelId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ clientCode: assignCode.trim() }),
      });
      setAssigningId(null);
      setAssignCode('');
      fetchParcels();
    } catch {
      alert('Ошибка привязки. Проверьте клиент-код.');
    } finally { setAssigning(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/50">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Неопознанные посылки
        </h1>
        <p className="mt-1 text-sm text-slate-500 ml-[52px]">Посылки без привязки к клиенту, ожидающие идентификации</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-red-500 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Всего неопознанных</p>
            <div className="p-2 rounded-lg bg-red-50"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{parcels.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">посылок</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">С телефоном на этикетке</p>
            <div className="p-2 rounded-lg bg-amber-50"><svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{parcels.filter(p => p.phoneOnLabel).length}</p>
          <p className="text-xs text-slate-400 mt-0.5">можно найти владельца</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Трекинг</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Телефон на этикетке</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Вес</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Описание</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Склад</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Дата</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div></td></tr>
              ) : parcels.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Неопознанных посылок нет</p>
                    <p className="text-xs text-slate-400">Все посылки привязаны к клиентам</p>
                  </div>
                </td></tr>
              ) : parcels.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">{p.trackingNumber || '—'}</td>
                  <td className="px-5 py-3.5">
                    {p.phoneOnLabel ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        {p.phoneOnLabel}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-700 tabular-nums">{p.weightKg ? `${Number(p.weightKg).toFixed(1)} кг` : '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{p.description || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{(p as any).warehouse?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(p.receivedAt || p.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-5 py-3.5 text-right">
                    {assigningId === p.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input type="text" value={assignCode} onChange={(e) => setAssignCode(e.target.value)} placeholder="CD-XXXX" className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                        <button onClick={() => handleAssign(p.id)} disabled={assigning} className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs text-white font-medium">{assigning ? '...' : 'OK'}</button>
                        <button onClick={() => { setAssigningId(null); setAssignCode(''); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setAssigningId(p.id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                        Привязать
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
