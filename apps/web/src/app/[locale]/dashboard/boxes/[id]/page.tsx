'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface BoxDetail {
  id: string;
  boxCode: string;
  status: string;
  weightKg: string | null;
  billableWeight: string | null;
  finalPrice: string | null;
  estimatedPrice: string | null;
  currency: string;
  customerNote: string | null;
  shelfLocation: string | null;
  createdAt: string;
  warehouse: { name: string } | null;
  batch: { batchCode: string; route: string; status: string } | null;
  parcels: { id: string; trackingNumber: string | null; description: string | null; weightKg: string | null; marketplace: string | null; status: string }[];
  statusLog: { id: string; status: string; createdAt: string; comment: string | null }[];
  payment: { amount: string; currency: string; method: string; paidAt: string | null } | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  REQUESTED: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
  PACKING: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  PACKED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  IN_TRANSIT: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  CUSTOMS: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  ARRIVED: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  READY: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export default function BoxDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<BoxDetail>(`/me/boxes/${id}`)
      .then(setBox)
      .catch((err) => setError(err.message || 'Ошибка'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  if (error || !box) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-red-500 text-sm">{error || t.common.notFound}</p>
      <a href={`/${locale}/dashboard/boxes`} className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">{t.common.back}</a>
    </div>
  );

  const sc = STATUS_COLORS[box.status] || STATUS_COLORS.REQUESTED;
  const dateLocale = locale === 'tg' ? 'tg-TJ' : 'ru-RU';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <a href={`/${locale}/dashboard/boxes`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        {t.common.back}
      </a>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className={`px-6 py-5 ${sc.bg} border-b border-slate-100`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.boxes.boxCode}</p>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{box.boxCode}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${sc.bg} ${sc.text} border`}>
              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
              {t.statuses[box.status as keyof typeof t.statuses] || box.status}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-slate-400">{t.common.weight}</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{box.weightKg ? `${Number(box.weightKg).toFixed(1)} кг` : '—'}</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-slate-400">{t.common.price}</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{box.finalPrice ? `$${Number(box.finalPrice).toFixed(2)}` : '—'}</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-slate-400">{t.parcels.title}</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{box.parcels.length}</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-slate-400">{t.common.date}</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{new Date(box.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-5">{t.track.timeline}</h2>
        <div className="space-y-0">
          {box.statusLog.map((log, i) => {
            const isLast = i === box.statusLog.length - 1;
            const logColor = STATUS_COLORS[log.status] || STATUS_COLORS.REQUESTED;
            return (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full shrink-0 ${isLast ? `${logColor.dot} ring-4 ring-opacity-20` : 'bg-slate-300'}`} style={isLast ? { boxShadow: `0 0 0 8px ${logColor.dot === 'bg-emerald-500' ? 'rgb(16 185 129 / 0.15)' : 'rgb(59 130 246 / 0.15)'}` } : undefined} />
                  {i < box.statusLog.length - 1 && <div className="w-px flex-1 min-h-[32px] bg-slate-200" />}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${logColor.bg} ${logColor.text}`}>
                      {t.statuses[log.status as keyof typeof t.statuses] || log.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.comment && <p className="text-sm text-slate-500 mt-1 italic">{log.comment}</p>}
                </div>
              </div>
            );
          })}
          {box.statusLog.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">{t.common.noData}</p>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Склад</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{box.warehouse?.name || '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Рейс</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{box.batch?.batchCode || '—'}</p>
          {box.batch?.route && <p className="text-xs text-slate-500 mt-0.5">{box.batch.route}</p>}
        </div>
        {box.payment && (
          <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Оплата</p>
            <p className="text-sm font-semibold text-emerald-600 mt-1">${Number(box.payment.amount).toFixed(2)} {box.payment.currency}</p>
            <p className="text-xs text-slate-500 mt-0.5">{box.payment.method} · {box.payment.paidAt ? new Date(box.payment.paidAt).toLocaleDateString(dateLocale) : '—'}</p>
          </div>
        )}
        {box.shelfLocation && (
          <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-violet-500 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Полка</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{box.shelfLocation}</p>
          </div>
        )}
      </div>

      {/* Parcels */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{t.parcels.title}</h2>
          <span className="text-xs text-slate-400">{box.parcels.length} шт.</span>
        </div>
        <div className="divide-y divide-slate-100">
          {box.parcels.map((p) => (
            <a key={p.id} href={`/${locale}/dashboard/parcels/${p.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{p.description || p.marketplace || p.trackingNumber || 'Посылка'}</p>
                <p className="text-xs text-slate-400">{p.trackingNumber || '—'} · {p.weightKg ? `${Number(p.weightKg).toFixed(1)} кг` : ''}</p>
              </div>
            </a>
          ))}
          {box.parcels.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">{t.common.noData}</div>
          )}
        </div>
      </div>

      {/* Customer note */}
      {box.customerNote && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Заметка клиента</p>
          <p className="text-sm text-amber-800 italic">{box.customerNote}</p>
        </div>
      )}
    </div>
  );
}
