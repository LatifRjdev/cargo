'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

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
  data: Parcel[];
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'Ожидает',
  RECEIVED: 'Принята',
  STORED: 'На складе',
  IN_BOX: 'В коробке',
};

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
        .then((res) => setParcels(res.data || []));
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
      setAddTrackingError(err.message || 'Ошибка при добавлении');
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
      .then((res) => setParcels(res.data || []))
      .catch((err) => setError(err.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои посылки</h1>
        <button
          onClick={() => setShowAddTracking(!showAddTracking)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Добавить трекинг
        </button>
      </div>

      {/* Add tracking form */}
      {showAddTracking && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Добавить трекинг-номер</h3>
          <p className="text-xs text-blue-600 mb-3">
            Укажите трекинг-номер маркетплейса, чтобы мы привязали посылку при поступлении на склад.
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
              placeholder="Трекинг-номер (напр. SF1234567890)"
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newMarketplace}
              onChange={(e) => setNewMarketplace(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Маркетплейс</option>
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>{MARKETPLACE_LABELS[m]}</option>
              ))}
            </select>
            <button
              onClick={handleAddTracking}
              disabled={addingTracking || !newTracking.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {addingTracking ? '...' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {/* Unidentified parcels awaiting claim */}
      {!unidentifiedLoading && unidentified.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">
            Ожидают подтверждения ({unidentified.length})
          </h2>
          <p className="text-xs text-amber-700 mb-3">
            Эти посылки были приняты без кода клиента. Если одна из них ваша — нажмите «Забрать».
          </p>
          <div className="space-y-2">
            {unidentified.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white border border-amber-100 p-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{p.tracking}</span>
                  {p.phoneOnLabel && (
                    <span className="ml-2 text-gray-500">тел: {p.phoneOnLabel}</span>
                  )}
                  {p.marketplace && (
                    <span className="ml-2 text-gray-500">{p.marketplace}</span>
                  )}
                  {p.weight && (
                    <span className="ml-2 text-gray-500">{p.weight} кг</span>
                  )}
                  {p.warehouse?.name && (
                    <span className="ml-2 text-xs text-gray-400">{p.warehouse.name}</span>
                  )}
                </div>
                <button
                  onClick={() => handleClaim(p.id)}
                  disabled={claimingId === p.id}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {claimingId === p.id ? '...' : 'Забрать'}
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Все' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : parcels.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="mt-4 text-gray-500">Посылок пока нет</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Трекинг</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Маркетплейс</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Категория</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Вес</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Статус</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Склад</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/ru/dashboard/parcels/${p.id}`} className="text-blue-600 hover:underline font-medium">
                        {p.tracking}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.marketplace || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.weight ? `${p.weight} кг` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.status === 'STORED' ? 'bg-green-100 text-green-700' :
                        p.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'IN_BOX' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.warehouse?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
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
                href={`/ru/dashboard/parcels/${p.id}`}
                className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-600">{p.tracking}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.status === 'STORED' ? 'bg-green-100 text-green-700' :
                    p.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' :
                    p.status === 'IN_BOX' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm text-gray-500">
                  <span>Маркетплейс: {p.marketplace || '—'}</span>
                  <span>Вес: {p.weight ? `${p.weight} кг` : '—'}</span>
                  <span>Склад: {p.warehouse?.name || '—'}</span>
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
