'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface ProfitSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  marginPct: number;
  boxes: BoxProfit[];
}

interface BoxProfit {
  boxId: string;
  boxCode: string;
  revenue: number;
  directExpenses: number;
  batchExpenseShare: number;
  totalExpenses: number;
  netProfit: number;
  marginPct: number;
}

export default function ProfitPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfit = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: dateFrom, to: dateTo });
      const data = await apiFetch<ProfitSummary>(`/admin/expenses/profit/summary?${params}`);
      setSummary(data);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfit();
  }, []);

  const handleApply = () => {
    fetchProfit();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-200/50">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </span>
          {t.nav.profit}
        </h1>
        <p className="text-sm text-slate-500 mt-1 ml-[52px]">Анализ доходов и расходов за период</p>
      </div>

      {/* Date range picker */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">С</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">По</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Загрузка...
              </>
            ) : t.common.apply}
          </button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <span className="text-sm text-slate-400">Загрузка данных...</span>
        </div>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Выручка</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">${summary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-red-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Расходы</p>
              </div>
              <p className="text-2xl font-bold text-red-600">${summary.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${summary.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <svg className={`h-5 w-5 ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Чистая прибыль</p>
              </div>
              <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${summary.netProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-violet-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${summary.marginPct >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <svg className={`h-5 w-5 ${summary.marginPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Маржа</p>
              </div>
              <p className={`text-2xl font-bold ${summary.marginPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.marginPct.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Boxes table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Прибыль по коробкам</h2>
              <p className="text-xs text-slate-400 mt-0.5">{summary.boxes.length} записей</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Коробка</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Выручка</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Прямые расходы</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Доля рейса</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Всего расходов</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Прибыль</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Маржа</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.boxes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-400">Нет данных за выбранный период</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    summary.boxes.map((box) => (
                      <tr key={box.boxId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-900">{box.boxCode}</td>
                        <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-700">${box.revenue.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-700">${box.directExpenses.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-700">${box.batchExpenseShare.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-700">${box.totalExpenses.toLocaleString()}</td>
                        <td className={`px-5 py-3.5 text-right text-sm tabular-nums font-semibold ${box.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          ${box.netProfit.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              box.marginPct >= 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {box.marginPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Выберите период и нажмите "Применить"</p>
          </div>
        </div>
      )}
    </div>
  );
}
