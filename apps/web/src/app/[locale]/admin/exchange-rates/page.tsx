'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

const currencies = ['USD', 'CNY', 'TJS'];

export default function ExchangeRatesPage() {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Курсы валют</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Добавить курс
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><p className="text-gray-500">Загрузка...</p></div>
      ) : rates.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">Курсы не заданы</div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {rates.map((r) => (
            <div key={r.id} className="px-5 py-4 flex items-center justify-between">
              {editingId === r.id ? (
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium">{r.fromCurrency} → {r.toCurrency}</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-40 rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => saveEdit(r)}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? '...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium">
                      1 {r.fromCurrency} = {Number(r.rate).toFixed(4)} {r.toCurrency}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Обновлено: {new Date(r.updatedAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(r)}
                    className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Изменить
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 mx-4">
            <h2 className="text-lg font-bold mb-4">Новый курс</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Из</label>
                  <select value={newFrom} onChange={(e) => setNewFrom(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                    {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">В</label>
                  <select value={newTo} onChange={(e) => setNewTo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                    {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Курс</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="10.85"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowAdd(false); setNewRate(''); }} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Отмена</button>
              <button onClick={handleAdd} disabled={saving || !newRate || newFrom === newTo} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? '...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
