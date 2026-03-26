'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Box {
  id: string;
  boxCode: string;
  status: string;
  finalPrice: number | null;
  billableWeight: number | null;
  currency: string;
  customer: { id: string; fullName: string; clientCode: string; phone: string } | null;
  payment: { id: string; amount: number; method: string; currency: string; paidAt: string } | null;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Наличные' },
  { value: 'TRANSFER', label: 'Перевод' },
  { value: 'CARD', label: 'Карта' },
];

export default function PickupPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Box[] | null>(null);

  // Payment modal
  const [payTarget, setPayTarget] = useState<Box | null>(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payAmount, setPayAmount] = useState('');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Deliver
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Box[]>('/pickup/pending');
      setBoxes(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const data = await apiFetch<Box[]>(`/pickup/search?q=${encodeURIComponent(search.trim())}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
  };

  const handlePay = async () => {
    if (!payTarget || !payAmount) return;
    setPaying(true);
    setPayError('');
    try {
      await apiFetch(`/pickup/${payTarget.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          method: payMethod,
          amount: parseFloat(payAmount),
          currency: payCurrency,
        }),
      });
      setPayTarget(null);
      setPayAmount('');
      setSuccess('Оплата принята');
      fetchPending();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setPayError(err.message || 'Ошибка оплаты');
    } finally {
      setPaying(false);
    }
  };

  const handleDeliver = async (boxId: string) => {
    setDeliveringId(boxId);
    try {
      await apiFetch(`/pickup/${boxId}/deliver`, { method: 'POST' });
      setSuccess('Коробка выдана клиенту');
      fetchPending();
      if (searchResults) {
        setSearchResults(searchResults.filter((b) => b.id !== boxId));
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch {
    } finally {
      setDeliveringId(null);
    }
  };

  const displayBoxes = searchResults !== null ? searchResults : boxes;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Выдача</h1>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по коду коробки, клиенту, телефону..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Найти
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => { setSearchResults(null); setSearch(''); }}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : displayBoxes.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          {searchResults !== null ? 'Ничего не найдено' : 'Нет коробок для выдачи'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayBoxes.map((box) => (
            <div key={box.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono font-medium text-gray-900">{box.boxCode}</span>
                  {box.billableWeight && (
                    <span className="ml-3 text-sm text-gray-500">{Number(box.billableWeight).toFixed(2)} кг</span>
                  )}
                </div>
                <div className="text-right">
                  {box.finalPrice && (
                    <span className="font-medium text-gray-900">
                      ${Number(box.finalPrice).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {box.customer && (
                    <>
                      <span className="font-medium">{box.customer.clientCode}</span>
                      {' — '}
                      {box.customer.fullName}
                      <span className="ml-2 text-gray-400">{box.customer.phone}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {box.payment ? (
                    <>
                      <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                        Оплачено ({box.payment.method})
                      </span>
                      <button
                        onClick={() => handleDeliver(box.id)}
                        disabled={deliveringId === box.id}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {deliveringId === box.id ? '...' : 'Выдать'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setPayTarget(box);
                        setPayAmount(box.finalPrice ? Number(box.finalPrice).toFixed(2) : '');
                        setPayCurrency(box.currency || 'USD');
                        setPayError('');
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Принять оплату
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Принять оплату</h3>
            <p className="text-sm text-gray-500 mb-4">
              {payTarget.boxCode} — {payTarget.customer?.fullName}
              {payTarget.finalPrice && (
                <span className="ml-2 font-medium text-gray-900">
                  (к оплате: ${Number(payTarget.finalPrice).toFixed(2)})
                </span>
              )}
            </p>

            {payError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {payError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Способ оплаты</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Сумма</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm text-gray-600 mb-1">Валюта</label>
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="TJS">TJS</option>
                    <option value="CNY">CNY</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setPayTarget(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handlePay}
                disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {paying ? 'Обработка...' : 'Подтвердить оплату'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
