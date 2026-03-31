'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Warehouse {
  id: string;
  name: string;
  address: string;
}

interface Tariff {
  id: string;
  originId: string;
  destinationId: string;
  ratePerKg: number;
  minPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  origin: { name: string; address: string };
  destination: { name: string; address: string };
}

export default function AdminTariffsPage() {
  const { t: i18n, locale } = useI18n();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formMinPrice, setFormMinPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formActive, setFormActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, w] = await Promise.all([
        apiFetch<Tariff[]>('/admin/tariffs'),
        apiFetch<Warehouse[]>('/admin/warehouses'),
      ]);
      setTariffs(t);
      setWarehouses(w);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormOrigin('');
    setFormDestination('');
    setFormRate('');
    setFormMinPrice('');
    setFormCurrency('USD');
    setFormActive(true);
    setEditingId(null);
    setError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (t: Tariff) => {
    setEditingId(t.id);
    setFormOrigin(t.originId);
    setFormDestination(t.destinationId);
    setFormRate(t.ratePerKg.toString());
    setFormMinPrice(t.minPrice.toString());
    setFormCurrency(t.currency);
    setFormActive(t.isActive);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formOrigin || !formDestination || !formRate) return;
    setSubmitLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        originId: formOrigin,
        destinationId: formDestination,
        ratePerKg: parseFloat(formRate),
        minPrice: parseFloat(formMinPrice) || 0,
        currency: formCurrency,
        isActive: formActive,
      };
      if (editingId) body.id = editingId;

      await apiFetch('/admin/tariffs', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </span>
            {i18n.nav.tariffs}
          </h1>
          <p className="mt-1 text-sm text-slate-500 ml-[52px]">
            Управление тарифными ставками между складами
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Добавить тариф
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/80">
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Откуда
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Куда
                </th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Ставка / кг
                </th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Мин. цена
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Валюта
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Статус
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="h-6 w-6 animate-spin text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm text-slate-400">Загрузка тарифов...</span>
                    </div>
                  </td>
                </tr>
              ) : tariffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-400">Тарифы не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tariffs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">{t.origin.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">{t.destination.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                      {t.ratePerKg}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">
                      {t.minPrice}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {t.currency}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          t.isActive
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : 'bg-slate-100 text-slate-500 ring-1 ring-slate-500/10'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            t.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {t.isActive ? i18n.common.active : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEdit(t)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        {i18n.common.edit}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingId ? 'Редактировать тариф' : 'Новый тариф'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {editingId ? 'Обновите параметры тарифа' : 'Заполните параметры нового тарифа'}
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Откуда (склад)
                </label>
                <select
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Куда (склад)
                </label>
                <select
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Ставка за кг
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Мин. цена
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMinPrice}
                    onChange={(e) => setFormMinPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Валюта
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="TJS">TJS</option>
                  </select>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-9 rounded-full border border-slate-200 bg-slate-100 transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-500/30" />
                      <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">Активен</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300/50"
              >
                {i18n.common.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading || !formOrigin || !formDestination || !formRate}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {submitLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {i18n.common.saving}
                  </>
                ) : (
                  i18n.common.save
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
