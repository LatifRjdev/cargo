'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface Parcel {
  id: string;
  trackingCode: string;
  clientCode: string;
  customerName: string;
  marketplace: string;
  weight: number;
  status: string;
  cell: string;
  createdAt: string;
}

interface ParcelsResponse {
  data: Parcel[];
  total: number;
  page: number;
  limit: number;
}

const rejectReasons = [
  'Запрещённый товар: батарея / аккумулятор',
  'Запрещённый товар: жидкость',
  'Запрещённый товар: порошок / химия',
  'Запрещённый товар: оружие / взрывчатые вещества',
  'Запрещённый товар: контрафакт',
  'Повреждена до неузнаваемости',
  'Другое',
];

const statusTabValues = ['', 'RECEIVED', 'IN_WAREHOUSE', 'PACKED', 'SHIPPED', 'DELIVERED', 'REJECTED'];

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-amber-50 text-amber-700 border border-amber-200',
  IN_WAREHOUSE: 'bg-blue-50 text-blue-700 border border-blue-200',
  PACKED: 'bg-purple-50 text-purple-700 border border-purple-200',
  SHIPPED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
};


export default function WarehouseParcelsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();

  const statusLabels: Record<string, string> = {
    RECEIVED: t.statuses.RECEIVED,
    IN_WAREHOUSE: t.statuses.STORED,
    PACKED: t.statuses.PACKED,
    SHIPPED: t.statuses.IN_TRANSIT,
    DELIVERED: t.statuses.DELIVERED,
    REJECTED: t.statuses.REJECTED,
  };

  const statusTabs = statusTabValues.map((value) => ({
    value,
    label: value === '' ? t.common.all : (statusLabels[value] || value),
  }));

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<Parcel | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCustomReason, setRejectCustomReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const data = await apiFetch<ParcelsResponse>(`/warehouse/parcels?${params}`);
      setParcels(data.data);
      setTotal(data.total);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchParcels();
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason === 'Другое' ? rejectCustomReason : rejectReason;
    if (!reason.trim()) return;
    setRejecting(true);
    setRejectError('');
    try {
      await apiFetch(`/warehouse/parcels/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setRejectTarget(null);
      setRejectReason('');
      setRejectCustomReason('');
      fetchParcels();
    } catch (err: any) {
      setRejectError(err.message || t.common.error);
    } finally {
      setRejecting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.nav.allParcels}</h1>
              <p className="text-amber-100 text-sm mt-0.5">{t.warehouse.parcelsOnWarehouse}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-amber-200 text-sm">{t.common.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            {t.common.find}
          </button>
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.parcels.trackingNumber}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.admin.code}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.admin.customer}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.parcels.marketplace}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.weight}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.status}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.warehouse.cells}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.date}</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
                    <p className="text-sm text-slate-400">{t.common.loading}</p>
                  </div>
                </td>
              </tr>
            ) : parcels.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400">{t.common.notFound}</p>
                  </div>
                </td>
              </tr>
            ) : (
              parcels.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-900">{p.trackingCode}</td>
                  <td className="px-4 py-3 text-slate-700">{p.clientCode}</td>
                  <td className="px-4 py-3 text-slate-700">{p.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{p.marketplace}</td>
                  <td className="px-4 py-3 text-slate-600">{p.weight} кг</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[p.status] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.cell || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString(locale === 'tg' ? 'tg-TJ' : 'ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    {(p.status === 'RECEIVED' || p.status === 'IN_WAREHOUSE') && (
                      <button
                        onClick={() => { setRejectTarget(p); setRejectReason(''); setRejectCustomReason(''); setRejectError(''); }}
                        className="rounded-lg bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                      >
                        {t.warehouse.reject}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {t.common.total}: {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              {t.common.prev}
            </button>
            <span className="px-3 py-1.5 text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              {t.common.forward}
            </button>
          </div>
        </div>
      )}
      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.warehouse.reject}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {rejectTarget.trackingCode} — {rejectTarget.customerName || rejectTarget.clientCode}
            </p>

            {rejectError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {rejectError}
              </div>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-1.5">Причина отклонения</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
            >
              <option value="">Выберите причину</option>
              {rejectReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {rejectReason === 'Другое' && (
              <textarea
                value={rejectCustomReason}
                onChange={(e) => setRejectCustomReason(e.target.value)}
                rows={2}
                placeholder="Укажите причину..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || (!rejectReason || (rejectReason === 'Другое' && !rejectCustomReason.trim()))}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rejecting ? t.common.saving : t.warehouse.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
