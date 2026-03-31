'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

const currencies = ['USD', 'CNY', 'TJS'];

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  CNY: '🇨🇳',
  TJS: '🇹🇯',
};

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

export default function ExchangeRatesPage() {
  const { t, locale } = useI18n();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newFrom, setNewFrom] = useState('USD');
  const [newTo, setNewTo] = useState('TJS');
  const [newRate, setNewRate] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ExchangeRate[]>('/admin/exchange-rates');
      setRates(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const startEdit = (r: ExchangeRate) => {
    setEditingId(r.id);
    setEditRate(r.rate.toString());
  };

  const saveEdit = async (r: ExchangeRate) => {
    if (!editRate) return;
    setSaving(true);
    try {
      await apiFetch('/admin/exchange-rates', {
        method: 'PUT',
        body: JSON.stringify({ fromCurrency: r.fromCurrency, toCurrency: r.toCurrency, rate: parseFloat(editRate) }),
      });
      setEditingId(null);
      fetchRates();
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newRate || newFrom === newTo) return;
    setSaving(true);
    try {
      await apiFetch('/admin/exchange-rates', {
        method: 'PUT',
        body: JSON.stringify({ fromCurrency: newFrom, toCurrency: newTo, rate: parseFloat(newRate) }),
      });
      setShowAdd(false);
      setNewRate('');
      fetchRates();
    } catch {
      alert('Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            {t.nav.exchangeRates}
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">
            Управление обменными курсами для конвертации валют
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить курс
        </button>
      </div>

      {/* Table card */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="w-8 h-8 text-blue-500" />
            <p className="text-sm text-slate-500">Загрузка курсов...</p>
          </div>
        </div>
      ) : rates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Курсы не заданы</p>
          <p className="text-xs text-slate-400 mt-1">Добавьте первый обменный курс, нажав кнопку выше</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr] px-5 py-3 bg-slate-50/50 border-b border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Валютная пара</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Курс</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Действие</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-100">
            {rates.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[2fr_2fr_1fr] items-center px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* Currency pair column */}
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{CURRENCY_FLAGS[r.fromCurrency] ?? '💱'}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {r.fromCurrency}
                      <span className="mx-1.5 text-slate-300">→</span>
                      {r.toCurrency}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Обновлено: {new Date(r.updatedAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>

                {/* Rate column */}
                <div>
                  {editingId === r.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.000001"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(r)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <Spinner className="w-3 h-3 text-white" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {t.common.save}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-baseline gap-1">
                      <span className="text-xs text-slate-400">1 {r.fromCurrency} =</span>
                      <span className="text-sm font-semibold text-slate-800">{Number(r.rate).toFixed(4)}</span>
                      <span className="text-xs text-slate-400">{r.toCurrency}</span>
                    </div>
                  )}
                </div>

                {/* Action column */}
                {editingId !== r.id && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => startEdit(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z" />
                      </svg>
                      {t.common.edit}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add rate modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Новый курс валют</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Укажите валютную пару и курс обмена</p>
                </div>
                <button
                  onClick={() => { setShowAdd(false); setNewRate(''); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600">Из валюты</label>
                  <select
                    value={newFrom}
                    onChange={(e) => setNewFrom(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600">В валюту</label>
                  <select
                    value={newTo}
                    onChange={(e) => setNewTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newFrom === newTo && (
                <div className="rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 px-3 py-2">
                  <p className="text-xs text-amber-600">Валюты должны быть разными</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">
                  Курс <span className="text-slate-400 font-normal">(1 {newFrom} = ? {newTo})</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="10.850000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={() => { setShowAdd(false); setNewRate(''); }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newRate || newFrom === newTo}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    {t.common.saving}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.common.add}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
