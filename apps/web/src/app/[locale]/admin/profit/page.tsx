'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface ProfitSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  marginPercent: number;
  boxes: BoxProfit[];
}

interface BoxProfit {
  id: string;
  boxCode: string;
  revenue: number;
  directExpenses: number;
  batchShare: number;
  totalExpenses: number;
  netProfit: number;
  marginPercent: number;
}

export default function ProfitPage() {
  const { user } = useAuth();
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Прибыль</h1>

      {/* Date range picker */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">С</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">По</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Загрузка...' : 'Применить'}
        </button>
      </div>

      {loading && !summary ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-lg border bg-white p-6">
              <p className="text-sm text-gray-500">Выручка</p>
              <p className="text-2xl font-bold mt-1">${summary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <p className="text-sm text-gray-500">Расходы</p>
              <p className="text-2xl font-bold mt-1 text-red-600">${summary.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <p className="text-sm text-gray-500">Чистая прибыль</p>
              <p className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.netProfit.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <p className="text-sm text-gray-500">Маржа</p>
              <p className={`text-2xl font-bold mt-1 ${summary.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.marginPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Boxes table */}
          <div className="rounded-lg border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Коробка</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Выручка</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Прямые расходы</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Доля рейса</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Всего расходов</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Прибыль</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Маржа</th>
                </tr>
              </thead>
              <tbody>
                {summary.boxes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Нет данных за выбранный период
                    </td>
                  </tr>
                ) : (
                  summary.boxes.map((box) => (
                    <tr key={box.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium">{box.boxCode}</td>
                      <td className="px-4 py-3 text-right">${box.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${box.directExpenses.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${box.batchShare.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${box.totalExpenses.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${box.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${box.netProfit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            box.marginPercent >= 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {box.marginPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Выберите период и нажмите "Применить"
        </div>
      )}
    </div>
  );
}
