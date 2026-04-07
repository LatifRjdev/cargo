'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Parcel {
  id: string;
  tracking: string;
  marketplace: string | null;
  category: string | null;
  weight: number | null;
  status: string;
  warehouse?: { name: string } | null;
  createdAt: string;
}

interface UnidentifiedParcel {
  id: string;
  tracking: string;
  phoneOnLabel: string | null;
  marketplace: string | null;
  weight: number | null;
  warehouse?: { name: string } | null;
  createdAt: string;
}

interface ParcelsResponse {
  items?: Parcel[];
  data?: Parcel[];
  total: number;
}

const STATUSES = ['all', 'WAITING', 'RECEIVED', 'STORED', 'IN_BOX'] as const;

const MARKETPLACES = ['TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER'] as const;
const MARKETPLACE_LABELS: Record<string, string> = {
  TAOBAO: 'Taobao',
  ALI_1688: '1688',
  PINDUODUO: 'Pinduoduo',
  POIZON: 'Poizon',
  OTHER: 'Другое',
};

export default function ParcelsPage() {
  const { t, locale } = useI18n();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [unidentified, setUnidentified] = useState<UnidentifiedParcel[]>([]);
  const [unidentifiedLoading, setUnidentifiedLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showAddTracking, setShowAddTracking] = useState(false);
  const [newTracking, setNewTracking] = useState('');
  const [newMarketplace, setNewMarketplace] = useState('');
  const [addingTracking, setAddingTracking] = useState(false);
  const [addTrackingError, setAddTrackingError] = useState('');

  const fetchUnidentified = () => {
    setUnidentifiedLoading(true);
    apiFetch<UnidentifiedParcel[]>('/me/parcels/unidentified')
      .then((res) => setUnidentified(Array.isArray(res) ? res : []))
      .catch(() => {})
      .finally(() => setUnidentifiedLoading(false));
  };

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    try {
      await apiFetch(`/me/parcels/${id}/claim`, { method: 'POST' });
      setUnidentified((prev) => prev.filter((p) => p.id !== id));
      // refresh main list
      const params = filter === 'all' ? '' : `&status=${filter}`;
      apiFetch<ParcelsResponse>(`/me/parcels?page=1&limit=20${params}`)
        .then((res) => setParcels(res.items || res.data || []));
    } catch {
      // silently fail
    } finally {
      setClaimingId(null);
    }
  };

  const handleAddTracking = async () => {
    if (!newTracking.trim()) return;
    setAddingTracking(true);
    setAddTrackingError('');
    try {
      await apiFetch('/me/parcels', {
        method: 'POST',
        body: JSON.stringify({
          trackingNumber: newTracking.trim(),
          marketplace: newMarketplace || undefined,
        }),
      });
      setNewTracking('');
      setNewMarketplace('');
      setShowAddTracking(false);
      // refresh parcels
      setFilter('all');
    } catch (err: any) {
      setAddTrackingError(err.message || t.common.error);
    } finally {
      setAddingTracking(false);
    }
  };

  useEffect(() => {
    fetchUnidentified();
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filter === 'all' ? '' : `&status=${filter}`;
    apiFetch<ParcelsResponse>(`/me/parcels?page=1&limit=20${params}`)
      .then((res) => setParcels(res.items || res.data || []))
      .catch((err) => setError(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      {/* Styled header section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white shadow-lg shadow-blue-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.customer.myParcels}</h1>
            <p className="text-sm text-blue-100 mt-1">{t.customer.viewAndTrack}</p>
          </div>
          <button
            onClick={() => setShowAddTracking(!showAddTracking)}
            className="rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/30 transition-colors"
          >
            + {t.parcels.addTracking}
          </button>
        </div>
      </div>

      {/* Add tracking form */}
      {showAddTracking && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">{t.parcels.addTracking}</h3>
          <p className="text-xs text-slate-500 mb-4">
            {t.parcels.trackingNumber}
          </p>
          {addTrackingError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              {addTrackingError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTracking}
              onChange={(e) => setNewTracking(e.target.value)}
              placeholder={t.parcels.trackingNumber}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <select
              value={newMarketplace}
              onChange={(e) => setNewMarketplace(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            >
              <option value="">{t.parcels.marketplace}</option>
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>{MARKETPLACE_LABELS[m]}</option>
              ))}
            </select>
            <button
              onClick={handleAddTracking}
              disabled={addingTracking || !newTracking.trim()}
              className="rounded-xl bg-blue-600 shadow-sm shadow-blue-200 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {addingTracking ? '...' : t.common.add}
            </button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.customer.myParcels}</p>
          <p className="text-2xl font-bold text-slate-900">{parcels.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-green-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.statuses.STORED}</p>
          <p className="text-2xl font-bold text-slate-900">{parcels.filter(p => p.status === 'STORED').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.statuses.IN_BOX}</p>
          <p className="text-2xl font-bold text-slate-900">{parcels.filter(p => p.status === 'IN_BOX').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-purple-500 shadow-sm hover:shadow-md transition-shadow p-4">
          <p className="text-xs text-slate-500 mb-1">{t.statuses.WAITING}</p>
          <p className="text-2xl font-bold text-slate-900">{unidentified.length}</p>
        </div>
      </div>

      {/* Unidentified parcels awaiting claim */}
      {!unidentifiedLoading && unidentified.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">
            Ожидают подтверждения ({unidentified.length})
          </h2>
          <p className="text-xs text-amber-600 mb-4">
            Эти посылки были приняты без кода клиента. Если одна из них ваша — нажмите «Забрать».
          </p>
          <div className="space-y-2">
            {unidentified.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <div className="text-sm">
                  <span className="font-medium text-slate-900">{p.tracking}</span>
                  {p.phoneOnLabel && (
                    <span className="ml-2 text-slate-500">тел: {p.phoneOnLabel}</span>
                  )}
                  {p.marketplace && (
                    <span className="ml-2 text-slate-500">{p.marketplace}</span>
                  )}
                  {p.weight && (
                    <span className="ml-2 text-slate-500">{p.weight} кг</span>
                  )}
                  {p.warehouse?.name && (
                    <span className="ml-2 text-xs text-slate-400">{p.warehouse.name}</span>
                  )}
                </div>
                <button
                  onClick={() => handleClaim(p.id)}
                  disabled={claimingId === p.id}
                  className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {claimingId === p.id ? '...' : t.common.confirm}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-200'
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
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600 mb-4" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : parcels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">{t.common.noData}</p>
          <p className="text-sm text-slate-400 mt-1">{t.parcels.addTracking}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.customer.trackingLabel}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.parcels.marketplace}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.parcels.category}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.common.weight}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.common.status}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.nav.warehouse}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">{t.common.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/${locale}/dashboard/parcels/${p.id}`} className="text-blue-600 hover:underline font-medium">
                        {p.tracking}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.marketplace || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.weight ? `${p.weight} кг` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                        p.status === 'STORED' ? 'bg-green-50 text-green-700 border-green-200' :
                        p.status === 'RECEIVED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        p.status === 'IN_BOX' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {t.statuses[p.status as keyof typeof t.statuses] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.warehouse?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {parcels.map((p) => (
              <Link
                key={p.id}
                href={`/${locale}/dashboard/parcels/${p.id}`}
                className="block bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-600">{p.tracking}</span>
                  <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                    p.status === 'STORED' ? 'bg-green-50 text-green-700 border-green-200' :
                    p.status === 'RECEIVED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    p.status === 'IN_BOX' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {t.statuses[p.status as keyof typeof t.statuses] || p.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm text-slate-500">
                  <span>{t.parcels.marketplace}: {p.marketplace || '—'}</span>
                  <span>{t.common.weight}: {p.weight ? `${p.weight} кг` : '—'}</span>
                  <span>{t.nav.warehouse}: {p.warehouse?.name || '—'}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
