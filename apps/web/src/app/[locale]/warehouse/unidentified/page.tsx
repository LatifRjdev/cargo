'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface UnidentifiedParcel {
  id: string;
  phoneOnLabel: string;
  weight: number;
  description: string;
  createdAt: string;
}

export default function UnidentifiedParcelsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [parcels, setParcels] = useState<UnidentifiedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<UnidentifiedParcel[]>('/warehouse/parcels/unidentified');
      setParcels(data);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const handleAssign = async (parcelId: string) => {
    if (!customerId.trim()) return;
    setAssignLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/warehouse/parcels/${parcelId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ customerId: customerId.trim() }),
      });
      setSuccess(t.common.success);
      setAssigningId(null);
      setCustomerId('');
      fetchParcels();
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Styled Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.nav.unidentified}</h1>
              <p className="text-amber-100 text-sm mt-0.5">{t.warehouse.needsAttention}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{parcels.length}</p>
              <p className="text-amber-200 text-sm">{t.warehouse.awaitingProcessing}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t.admin.unidentifiedParcels}</p>
              <p className="text-3xl font-bold mt-2 text-amber-700">{parcels.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.admin.parcels}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-orange-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t.warehouse.needsAttention}</p>
              <p className="text-3xl font-bold mt-2 text-orange-700">{parcels.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.warehouse.awaitingProcessing}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.phone}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.weight}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.description}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.date}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
                    <p className="text-sm text-slate-400">{t.common.loading}</p>
                  </div>
                </td>
              </tr>
            ) : parcels.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400">{t.common.noData}</p>
                  </div>
                </td>
              </tr>
            ) : (
              parcels.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-900">{p.phoneOnLabel}</td>
                  <td className="px-4 py-3 text-slate-600">{p.weight} кг</td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-600">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString(locale === 'tg' ? 'tg-TJ' : 'ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    {assigningId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customerId}
                          onChange={(e) => setCustomerId(e.target.value)}
                          placeholder="CD-XXXX"
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                        />
                        <button
                          onClick={() => handleAssign(p.id)}
                          disabled={assignLoading || !customerId.trim()}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {assignLoading ? '...' : 'OK'}
                        </button>
                        <button
                          onClick={() => { setAssigningId(null); setCustomerId(''); }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningId(p.id)}
                        className="rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                      >
                        {t.warehouse.assign}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
