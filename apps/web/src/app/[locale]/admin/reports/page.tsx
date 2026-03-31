'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

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
  const { t, locale } = useI18n();
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
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200/50">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </span>
          {t.admin.reportsTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1 ml-[52px]">{t.admin.reportsSubtitle}</p>
      </div>

      {/* Pill-style Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-slate-100/60 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date filters + Export */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(activeTab === 'revenue' || activeTab === 'parcels') && (
          <>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">С</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">По</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                {t.common.apply}
              </button>
            </div>
          </>
        )}
        {exportableTabs.includes(activeTab) && (
          <div className="flex items-end ml-auto">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {exporting ? t.admin.exporting : t.common.downloadCsv}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">{t.common.noData}</p>
        </div>
      ) : (
        <div>
          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <p className="text-sm text-slate-500">Всего оплат</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{data.count}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <p className="text-sm text-slate-500">Общая выручка</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${data.totalRevenue?.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-violet-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <p className="text-sm text-slate-500">По валютам</p>
                  <div className="mt-2 space-y-1">
                    {data.byCurrency && Object.entries(data.byCurrency).map(([cur, amt]: [string, any]) => (
                      <p key={cur} className="text-sm font-medium text-slate-700">{amt.toLocaleString()} {cur}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Дата</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Коробка</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Склад</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Маршрут</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Метод</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ru-RU') : '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.boxCode || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.warehouse || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.route || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.method}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{p.amount?.toLocaleString()} {p.currency}</td>
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
              <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-5 mb-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <p className="text-sm text-slate-500">Всего посылок</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{data.total}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">По статусу</h3>
                  <div className="space-y-2">
                    {data.byStatus?.map((s: any) => (
                      <div key={s.status} className="flex items-center justify-between py-1">
                        <span className="text-sm text-slate-600">{s.status}</span>
                        <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-violet-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">По маркетплейсу</h3>
                  <div className="space-y-2">
                    {data.byMarketplace?.map((m: any) => (
                      <div key={m.marketplace} className="flex items-center justify-between py-1">
                        <span className="text-sm text-slate-600">{m.marketplace}</span>
                        <span className="text-sm font-semibold text-slate-900">{m.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Time Tab */}
          {activeTab === 'delivery' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Маршрут</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Среднее время (дней)</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Всего доставлено</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(data) && data.map((r: any) => (
                    <tr key={r.route} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.route}</td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">{r.avgDays}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{r.totalDelivered}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data) || data.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                        <p className="text-slate-400 text-sm">{t.common.noData} о доставках</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Debts Tab */}
          {activeTab === 'debts' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 border-t-[3px] border-t-red-500 p-5 shadow-sm">
                  <p className="text-sm text-red-600 font-medium">Неоплаченных коробок</p>
                  <p className="text-3xl font-bold text-red-700 mt-1">{data.totalUnpaid}</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 border-t-[3px] border-t-red-500 p-5 shadow-sm">
                  <p className="text-sm text-red-600 font-medium">Общая задолженность</p>
                  <p className="text-3xl font-bold text-red-700 mt-1">${data.totalDebt?.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                {data.byCustomer?.map((c: any) => (
                  <div key={c.customer.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <a href={`/${locale}/admin/users/${c.customer.id}`} className="font-medium text-blue-600 hover:underline">
                          {c.customer.fullName || c.customer.phone}
                        </a>
                        <span className="text-xs text-slate-400 ml-2 font-mono">{c.customer.clientCode}</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">${c.totalDebt.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      {c.boxes.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between text-sm text-slate-600 py-0.5">
                          <span className="font-mono text-xs text-slate-500">{b.boxCode}</span>
                          <span className="font-medium">{b.price.toLocaleString()} {b.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!data.byCustomer || data.byCustomer.length === 0) && (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-slate-400 text-sm">Задолженностей нет</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Marketplaces Tab */}
          {activeTab === 'marketplaces' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Маркетплейс</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Кол-во посылок</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Общий вес (кг)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(data) && data.map((m: any) => (
                    <tr key={m.marketplace} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.marketplace}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{m.count}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{m.totalWeight?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data) || data.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" /></svg>
                        <p className="text-slate-400 text-sm">{t.common.noData}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Категория</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Кол-во посылок</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Общий вес (кг)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(data) && data.map((c: any) => (
                    <tr key={c.category} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{c.category || 'Без категории'}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{c.count}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{c.totalWeight?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data) || data.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                        <p className="text-slate-400 text-sm">{t.common.noData}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div>
              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-5 py-3 mb-4 shadow-sm">
                <p className="text-sm text-amber-700 font-medium">Посылки на складе более 30 дней</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Трекинг</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Клиент</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Склад</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Дней</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Вес</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(data) && data.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.trackingNumber}</td>
                        <td className="px-4 py-3">
                          {p.customer ? (
                            <a href={`/${locale}/admin/users/${p.customer.id}`} className="text-blue-600 hover:underline text-xs">
                              {p.customer.fullName || p.customer.phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.warehouse || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${p.storageDays > 60 ? 'text-red-600' : p.storageDays > 30 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {p.storageDays}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{p.weight ? `${p.weight} кг` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {(!Array.isArray(data) || data.length === 0) && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                          <p className="text-slate-400 text-sm">Нет посылок на долгом хранении</p>
                        </div>
                      </td></tr>
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
