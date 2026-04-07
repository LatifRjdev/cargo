'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface CustomerAnalytics {
  id: string;
  fullName: string | null;
  phone: string;
  clientCode: string | null;
  totalSpent: number;
  parcelCount: number;
  boxCount: number;
  avgOrderValue: number;
  ltv: number;
  daysSinceFirst: number;
  firstOrder: string;
  lastOrder: string;
  isActive: boolean;
}

export default function AdminAnalyticsPage() {
  const { locale } = useI18n();
  const [data, setData] = useState<CustomerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<CustomerAnalytics[]>('/admin/analytics/customers');
        setData(res);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = data.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.fullName || '').toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.clientCode || '').toLowerCase().includes(q)
    );
  });

  const totalCustomers = data.length;
  const totalRevenue = data.reduce((s, c) => s + c.totalSpent, 0);
  const avgLtv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const topSpender = data[0];

  const fmt = (n: number) => n.toLocaleString(locale === 'tg' ? 'tg-TJ' : 'ru-RU', { maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString(locale === 'tg' ? 'tg-TJ' : 'ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const summaryCards = [
    { label: 'Всего клиентов', value: totalCustomers, color: 'blue' },
    { label: 'Общая выручка', value: `${fmt(totalRevenue)} $`, color: 'green' },
    { label: 'Средний LTV', value: `${fmt(avgLtv)} $`, color: 'purple' },
    { label: 'Топ клиент', value: topSpender?.fullName || topSpender?.phone || '-', color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Аналитика клиентов</h1>
          <p className="text-sm text-slate-500 mt-1">Подробная статистика по каждому клиенту</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colorMap[card.color]}`} />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-slate-900 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 flex-1 max-w-md focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <svg className="w-4 h-4 text-slate-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону, коду..."
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none flex-1"
            />
          </div>
          <span className="text-sm text-slate-400">{filtered.length} из {data.length}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Клиент</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Телефон</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Посылок</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Коробок</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Потрачено</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Ср.чек</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">LTV</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Первый заказ</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Последний заказ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400">Нет данных</td>
                  </tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <a href={`/${locale}/admin/users/${c.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(c.fullName || c.phone || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{c.fullName || '-'}</p>
                          <p className="text-[11px] text-slate-400">{c.clientCode}</p>
                        </div>
                      </a>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">{c.phone}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{c.parcelCount}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{c.boxCount}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(c.totalSpent)} $</td>
                    <td className="px-5 py-3 text-right text-slate-600">{fmt(c.avgOrderValue)} $</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${c.ltv > avgLtv ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {fmt(c.ltv)} $
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(c.firstOrder)}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(c.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
