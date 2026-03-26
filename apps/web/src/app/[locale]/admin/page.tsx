'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface TrendPoint {
  date: string;
  intake: number;
  packed: number;
  revenue: number;
}

interface DashboardData {
  today: {
    intake: number;
    packed: number;
    shipped: number;
    revenue: number;
  };
  totals: {
    parcels: number;
    boxes: number;
    customers: number;
    pendingPickup: number;
    unidentified: number;
  };
  parcelsByStatus: { status: string; count: number }[];
  boxesByStatus: { status: string; count: number }[];
}

const parcelStatusLabels: Record<string, string> = {
  WAITING: 'Ожидает',
  RECEIVED: 'Принята',
  IN_WAREHOUSE: 'На складе',
  IN_BOX: 'В коробке',
  REJECTED: 'Отклонена',
};

const boxStatusLabels: Record<string, string> = {
  REQUESTED: 'Запрошена',
  PACKED: 'Упакована',
  IN_TRANSIT: 'В пути',
  CUSTOMS: 'Таможня',
  ARRIVED: 'Прибыла',
  READY: 'Готова к выдаче',
  DELIVERED: 'Выдана',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardData>('/admin/dashboard'),
      apiFetch<TrendPoint[]>('/admin/dashboard/trends?days=14'),
    ])
      .then(([dashboard, trendData]) => {
        setData(dashboard);
        setTrends(trendData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await apiFetch<any>(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(results);
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">Ошибка загрузки данных</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>

      {/* Global Search */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Поиск по клиентам, посылкам, коробкам, рейсам..."
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {searching ? 'Поиск...' : 'Найти'}
          </button>
        </div>

        {searchResults && (
          <div className="mt-3 rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Результаты поиска</h3>
              <button
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Закрыть
              </button>
            </div>

            {searchResults.clients?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Клиенты ({searchResults.clients.length})</p>
                <div className="space-y-1">
                  {searchResults.clients.map((c: any) => (
                    <a key={c.id} href={`/ru/admin/users/${c.id}`} className="block rounded px-2 py-1 text-sm hover:bg-gray-50">
                      <span className="font-medium">{c.fullName || c.phone}</span>
                      <span className="text-gray-400 ml-2">{c.clientCode}</span>
                      <span className="text-gray-400 ml-2 text-xs">{c.role}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {searchResults.parcels?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Посылки ({searchResults.parcels.length})</p>
                <div className="space-y-1">
                  {searchResults.parcels.map((p: any) => (
                    <div key={p.id} className="rounded px-2 py-1 text-sm hover:bg-gray-50">
                      <span className="font-mono font-medium">{p.trackingNumber}</span>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{parcelStatusLabels[p.status] || p.status}</span>
                      {p.marketplace && <span className="text-gray-400 ml-2 text-xs">{p.marketplace}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.boxes?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Коробки ({searchResults.boxes.length})</p>
                <div className="space-y-1">
                  {searchResults.boxes.map((b: any) => (
                    <div key={b.id} className="rounded px-2 py-1 text-sm hover:bg-gray-50">
                      <span className="font-mono font-medium">{b.boxCode}</span>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{boxStatusLabels[b.status] || b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.batches?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Рейсы ({searchResults.batches.length})</p>
                <div className="space-y-1">
                  {searchResults.batches.map((b: any) => (
                    <div key={b.id} className="rounded px-2 py-1 text-sm hover:bg-gray-50">
                      <span className="font-mono font-medium">{b.batchCode}</span>
                      <span className="ml-2 text-gray-400 text-xs">{b.route}</span>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searchResults.clients?.length && !searchResults.parcels?.length && !searchResults.boxes?.length && !searchResults.batches?.length && (
              <p className="text-sm text-gray-500">Ничего не найдено</p>
            )}
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Приёмка сегодня</p>
          <p className="text-3xl font-bold mt-1">{data.today.intake}</p>
          <p className="text-xs text-gray-400 mt-1">посылок</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Упаковано сегодня</p>
          <p className="text-3xl font-bold mt-1">{data.today.packed}</p>
          <p className="text-xs text-gray-400 mt-1">коробок</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Отправлено сегодня</p>
          <p className="text-3xl font-bold mt-1">{data.today.shipped}</p>
          <p className="text-xs text-gray-400 mt-1">рейсов</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Выручка сегодня</p>
          <p className="text-3xl font-bold mt-1">${data.today.revenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">оплаты</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Всего посылок</p>
          <p className="text-2xl font-bold">{data.totals.parcels}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Всего коробок</p>
          <p className="text-2xl font-bold">{data.totals.boxes}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Клиентов</p>
          <p className="text-2xl font-bold">{data.totals.customers}</p>
        </div>
        <div className="rounded-lg border bg-amber-50 border-amber-200 p-4">
          <p className="text-xs text-amber-600">Ожидают выдачи</p>
          <p className="text-2xl font-bold text-amber-700">{data.totals.pendingPickup}</p>
        </div>
        <div className="rounded-lg border bg-red-50 border-red-200 p-4">
          <p className="text-xs text-red-600">Неопознанные</p>
          <p className="text-2xl font-bold text-red-700">{data.totals.unidentified}</p>
        </div>
      </div>

      {/* Trends Charts */}
      {trends.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Intake & Packed Trend */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Приёмка и упаковка (14 дней)</h2>
            <div className="flex items-end gap-1 h-32">
              {trends.map((t) => {
                const maxVal = Math.max(...trends.map((x) => Math.max(x.intake, x.packed)), 1);
                return (
                  <div key={t.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${t.date}: ${t.intake} / ${t.packed}`}>
                    <div className="w-full flex gap-px justify-center" style={{ height: '100%', alignItems: 'flex-end' }}>
                      <div
                        className="w-1/2 bg-blue-400 rounded-t"
                        style={{ height: `${(t.intake / maxVal) * 100}%`, minHeight: t.intake ? 2 : 0 }}
                      />
                      <div
                        className="w-1/2 bg-green-400 rounded-t"
                        style={{ height: `${(t.packed / maxVal) * 100}%`, minHeight: t.packed ? 2 : 0 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              <span>{trends[0]?.date.slice(5)}</span>
              <span>{trends[trends.length - 1]?.date.slice(5)}</span>
            </div>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-sm bg-blue-400" /> Приёмка</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-sm bg-green-400" /> Упаковка</span>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Выручка (14 дней)</h2>
            <div className="flex items-end gap-1 h-32">
              {trends.map((t) => {
                const maxRev = Math.max(...trends.map((x) => x.revenue), 1);
                return (
                  <div key={t.date} className="flex-1 flex flex-col items-center" title={`${t.date}: $${t.revenue}`}>
                    <div className="w-full flex justify-center" style={{ height: '100%', alignItems: 'flex-end' }}>
                      <div
                        className="w-3/4 bg-emerald-400 rounded-t"
                        style={{ height: `${(t.revenue / maxRev) * 100}%`, minHeight: t.revenue ? 2 : 0 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              <span>{trends[0]?.date.slice(5)}</span>
              <span>{trends[trends.length - 1]?.date.slice(5)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Итого: ${trends.reduce((s, t) => s + t.revenue, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Посылки по статусу</h2>
          <div className="space-y-2">
            {data.parcelsByStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{parcelStatusLabels[s.status] || s.status}</span>
                <span className="text-sm font-medium">{s.count}</span>
              </div>
            ))}
            {data.parcelsByStatus.length === 0 && (
              <p className="text-sm text-gray-400">Нет данных</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Коробки по статусу</h2>
          <div className="space-y-2">
            {data.boxesByStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{boxStatusLabels[s.status] || s.status}</span>
                <span className="text-sm font-medium">{s.count}</span>
              </div>
            ))}
            {data.boxesByStatus.length === 0 && (
              <p className="text-sm text-gray-400">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
