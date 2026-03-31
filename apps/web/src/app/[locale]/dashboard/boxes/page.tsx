'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Box {
  id: string;
  boxCode: string;
  status: string;
  weightKg: string | number | null;
  finalPrice: string | number | null;
  currency: string;
  createdAt: string;
  parcels?: any[];
}

interface BoxesResponse {
  items: Box[];
  meta?: any;
}

// STATUS_LABELS now comes from t.statuses

const STATUSES = ['all', 'REQUESTED', 'PACKED', 'IN_TRANSIT', 'ARRIVED', 'READY', 'DELIVERED'] as const;

const STATUS_BORDER_COLORS: Record<string, string> = {
  REQUESTED: 'border-t-slate-400',
  PACKING: 'border-t-purple-500',
  PACKED: 'border-t-blue-500',
  IN_TRANSIT: 'border-t-amber-500',
  CUSTOMS: 'border-t-orange-500',
  ARRIVED: 'border-t-teal-500',
  READY: 'border-t-green-500',
  DELIVERED: 'border-t-emerald-500',
};

export default function BoxesPage() {
  const { t, locale } = useI18n();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const params = filter === 'all' ? '' : `&status=${filter}`;
    apiFetch<BoxesResponse>(`/me/boxes?page=1&limit=20${params}`)
      .then((res) => setBoxes(res.items || res.data || []))
      .catch((err) => setError(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      {/* Styled header section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 text-white shadow-lg shadow-indigo-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t.customer.myBoxes}</h1>
            <p className="text-sm text-indigo-100 mt-1">{t.customer.deliveryStatus}</p>
          </div>
          <Link
            href={`/${locale}/dashboard/boxes/build`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.boxes.buildBox}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-indigo-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.common.total}</p>
          <p className="text-2xl font-bold text-slate-900">{boxes.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.statuses.IN_TRANSIT}</p>
          <p className="text-2xl font-bold text-slate-900">{boxes.filter(b => ['IN_TRANSIT', 'CUSTOMS'].includes(b.status)).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-green-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.statuses.ARRIVED}</p>
          <p className="text-2xl font-bold text-slate-900">{boxes.filter(b => ['ARRIVED', 'READY'].includes(b.status)).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.statuses.DELIVERED}</p>
          <p className="text-2xl font-bold text-slate-900">{boxes.filter(b => b.status === 'DELIVERED').length}</p>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50/50 shadow-sm'
            }`}
          >
            {s === 'all' ? t.common.all : t.statuses[s as keyof typeof t.statuses] || s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600 mb-4" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : boxes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">{t.common.noData}</p>
          <Link
            href={`/${locale}/dashboard/boxes/build`}
            className="mt-3 inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.boxes.buildBox}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => (
            <div key={box.id} className={`bg-white rounded-2xl border border-slate-200/80 border-t-[3px] ${STATUS_BORDER_COLORS[box.status] || 'border-t-slate-300'} shadow-sm hover:shadow-md transition-all p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900">{box.boxCode}</span>
                <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                  ['IN_TRANSIT', 'CUSTOMS'].includes(box.status) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  box.status === 'ARRIVED' ? 'bg-green-50 text-green-700 border-green-200' :
                  box.status === 'DELIVERED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {t.statuses[box.status as keyof typeof t.statuses] || box.status}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>{t.common.weight}</span>
                  <span className="text-slate-700 font-medium">{box.weightKg ? `${Number(box.weightKg).toFixed(1)} кг` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.common.price}</span>
                  <span className="text-slate-700 font-medium">{box.finalPrice ? `$${Number(box.finalPrice).toFixed(2)}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.customer.parcelsLabel}</span>
                  <span className="text-slate-700 font-medium">{box.parcels?.length ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.common.date}</span>
                  <span className="text-slate-700 font-medium">{new Date(box.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
