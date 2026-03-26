'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Tab = 'revenue' | 'parcels' | 'delivery' | 'debts' | 'marketplaces' | 'storage' | 'categories';

const tabs: { key: Tab; label: string }[] = [
  { key: 'revenue', label: 'Выручка' },
  { key: 'parcels', label: 'Посылки' },
  { key: 'delivery', label: 'Сроки доставки' },
  { key: 'debts', label: 'Задолженности' },
  { key: 'marketplaces', label: 'Маркетплейсы' },
  { key: 'storage', label: 'Хранение' },
  { key: 'categories', label: 'Категории' },
];

const exportableTabs: Tab[] = ['revenue', 'marketplaces', 'categories', 'debts'];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('revenue');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const endpointMap: Record<Tab, string> = {
    revenue: 'revenue',
    parcels: 'parcels',
    delivery: 'delivery-time',
    debts: 'debts',
    marketplaces: 'marketplaces',
    storage: 'storage',
    categories: 'categories',
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const result = await apiFetch<any>(`/admin/reports/${endpointMap[activeTab]}?${params}`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const result = await apiFetch<{ csv: string }>(`/admin/reports/export/${activeTab}?${params}`);
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Ошибка экспорта');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Отчёты</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date filters + Export */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(activeTab === 'revenue' || activeTab === 'parcels') && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">С</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">По</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Применить
              </button>
            </div>
          </>
        )}
        {exportableTabs.includes(activeTab) && (
          <div className="flex items-end ml-auto">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'Экспорт...' : 'Скачать CSV'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Нет данных</p>
        </div>
      ) : (
        <div>
          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-lg border bg-white p-5">
                  <p className="text-sm text-gray-500">Всего оплат</p>
                  <p className="text-2xl font-bold">{data.count}</p>
                </div>
                <div className="rounded-lg border bg-white p-5">
                  <p className="text-sm text-gray-500">Общая выручка</p>
                  <p className="text-2xl font-bold">${data.totalRevenue?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border bg-white p-5">
                  <p className="text-sm text-gray-500">По валютам</p>
                  <div className="mt-1 space-y-1">
                    {data.byCurrency && Object.entries(data.byCurrency).map(([cur, amt]: [string, any]) => (
                      <p key={cur} className="text-sm">{amt.toLocaleString()} {cur}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Коробка</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Склад</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Маршрут</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Метод</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments?.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ru-RU') : '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{p.boxCode || '—'}</td>
                        <td className="px-4 py-3 text-xs">{p.warehouse || '—'}</td>
                        <td className="px-4 py-3 text-xs">{p.route || '—'}</td>
                        <td className="px-4 py-3 text-xs">{p.method}</td>
                        <td className="px-4 py-3 text-right font-medium">{p.amount?.toLocaleString()} {p.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parcels Tab */}
          {activeTab === 'parcels' && (
            <div>
              <div className="rounded-lg border bg-white p-5 mb-6">
                <p className="text-sm text-gray-500">Всего посылок</p>
                <p className="text-3xl font-bold">{data.total}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">По статусу</h3>
                  <div className="space-y-2">
                    {data.byStatus?.map((s: any) => (
                      <div key={s.status} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{s.status}</span>
                        <span className="text-sm font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">По маркетплейсу</h3>
                  <div className="space-y-2">
                    {data.byMarketplace?.map((m: any) => (
                      <div key={m.marketplace} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{m.marketplace}</span>
                        <span className="text-sm font-medium">{m.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Time Tab */}
          {activeTab === 'delivery' && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Маршрут</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Среднее время (дней)</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Всего доставлено</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((r: any) => (
                    <tr key={r.route} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.route}</td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">{r.avgDays}</td>
                      <td className="px-4 py-3 text-right">{r.totalDelivered}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data) || data.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Нет данных о доставках</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Debts Tab */}
          {activeTab === 'debts' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="rounded-lg border bg-red-50 border-red-200 p-5">
                  <p className="text-sm text-red-600">Неоплаченных коробок</p>
                  <p className="text-3xl font-bold text-red-700">{data.totalUnpaid}</p>
                </div>
                <div className="rounded-lg border bg-red-50 border-red-200 p-5">
                  <p className="text-sm text-red-600">Общая задолженность</p>
                  <p className="text-3xl font-bold text-red-700">${data.totalDebt?.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                {data.byCustomer?.map((c: any) => (
                  <div key={c.customer.id} className="rounded-lg border bg-white p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <a href={`/ru/admin/users/${c.customer.id}`} className="font-medium text-blue-600 hover:underline">
                          {c.customer.fullName || c.customer.phone}
                        </a>
                        <span className="text-xs text-gray-400 ml-2 font-mono">{c.customer.clientCode}</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">${c.totalDebt.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                      {c.boxes.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between text-sm text-gray-600">
                          <span className="font-mono text-xs">{b.boxCode}</span>
                          <span>{b.price.toLocaleString()} {b.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!data.byCustomer || data.byCustomer.length === 0) && (
                  <div className="text-center py-8 text-gray-400">Задолженностей нет</div>
                )}
              </div>
            </div>
          )}

          {/* Marketplaces Tab */}
          {activeTab === 'marketplaces' && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Маркетплейс</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Кол-во посылок</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Общий вес (кг)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((m: any) => (
                    <tr key={m.marketplace} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{m.marketplace}</td>
                      <td className="px-4 py-3 text-right">{m.count}</td>
                      <td className="px-4 py-3 text-right">{m.totalWeight?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data) || data.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Нет данных</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Категория</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Кол-во посылок</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Общий вес (кг)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((c: any) => (
                    <tr key={c.category} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.category || 'Без категории'}</td>
                      <td className="px-4 py-3 text-right">{c.count}</td>
                      <td className="px-4 py-3 text-right">{c.totalWeight?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data) || data.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Нет данных</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">Посылки на складе более 30 дней</p>
              <div className="rounded-lg border bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Трекинг</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Клиент</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Склад</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Дней</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Вес</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data) && data.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{p.trackingNumber}</td>
                        <td className="px-4 py-3">
                          {p.customer ? (
                            <a href={`/ru/admin/users/${p.customer.id}`} className="text-blue-600 hover:underline text-xs">
                              {p.customer.fullName || p.customer.phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">{p.warehouse || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${p.storageDays > 60 ? 'text-red-600' : p.storageDays > 30 ? 'text-amber-600' : ''}`}>
                            {p.storageDays}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{p.weight ? `${p.weight} кг` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {(!Array.isArray(data) || data.length === 0) && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Нет посылок на долгом хранении</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
