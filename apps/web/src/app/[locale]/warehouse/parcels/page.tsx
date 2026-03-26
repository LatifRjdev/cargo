'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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

const statusTabs = [
  { value: '', label: 'Все' },
  { value: 'RECEIVED', label: 'Принято' },
  { value: 'IN_WAREHOUSE', label: 'На складе' },
  { value: 'PACKED', label: 'Упаковано' },
  { value: 'SHIPPED', label: 'Отправлено' },
  { value: 'DELIVERED', label: 'Доставлено' },
  { value: 'REJECTED', label: 'Отклонено' },
];

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-yellow-100 text-yellow-800',
  IN_WAREHOUSE: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  RECEIVED: 'Принято',
  IN_WAREHOUSE: 'На складе',
  PACKED: 'Упаковано',
  SHIPPED: 'Отправлено',
  DELIVERED: 'Доставлено',
  REJECTED: 'Отклонено',
};

export default function WarehouseParcelsPage() {
  const { user } = useAuth();
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
      setRejectError(err.message || 'Ошибка при отклонении');
    } finally {
      setRejecting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Все посылки</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по трекингу, коду клиента, имени..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Найти
          </button>
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Трекинг</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Код клиента</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Маркетплейс</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Вес</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ячейка</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : parcels.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Посылки не найдены
                </td>
              </tr>
            ) : (
              parcels.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.trackingCode}</td>
                  <td className="px-4 py-3">{p.clientCode}</td>
                  <td className="px-4 py-3">{p.customerName}</td>
                  <td className="px-4 py-3">{p.marketplace}</td>
                  <td className="px-4 py-3">{p.weight} кг</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.cell || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    {(p.status === 'RECEIVED' || p.status === 'IN_WAREHOUSE') && (
                      <button
                        onClick={() => { setRejectTarget(p); setRejectReason(''); setRejectCustomReason(''); setRejectError(''); }}
                        className="rounded-lg bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Отклонить
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
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Всего: {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Отклонить посылку</h3>
            <p className="text-sm text-gray-500 mb-4">
              {rejectTarget.trackingCode} — {rejectTarget.customerName || rejectTarget.clientCode}
            </p>

            {rejectError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {rejectError}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">Причина отклонения</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                className="w-full rounded-lg border px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || (!rejectReason || (rejectReason === 'Другое' && !rejectCustomReason.trim()))}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rejecting ? 'Отклоняем...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
