'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

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
  const { t, locale } = useI18n();
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
      setSuccess(t.common.success);
      fetchPending();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setPayError(err.message || t.common.error);
    } finally {
      setPaying(false);
    }
  };

  const handleDeliver = async (boxId: string) => {
    setDeliveringId(boxId);
    try {
      await apiFetch(`/pickup/${boxId}/deliver`, { method: 'POST' });
      setSuccess(t.common.success);
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
  const paidCount = displayBoxes.filter((b) => b.payment).length;
  const unpaidCount = displayBoxes.filter((b) => !b.payment).length;

  return (
    <div className="space-y-6">
      {/* Styled Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.warehouse.pickup}</h1>
              <p className="text-amber-100 text-sm mt-0.5">{t.warehouse.giveToClients}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{displayBoxes.length}</p>
              <p className="text-amber-200 text-sm">{t.warehouse.pickup}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{paidCount}</p>
              <p className="text-amber-200 text-sm">Оплачено</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{unpaidCount}</p>
              <p className="text-amber-200 text-sm">Ожидают оплаты</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t.common.total}</p>
              <p className="text-3xl font-bold mt-2 text-amber-700">{displayBoxes.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Оплачено</p>
              <p className="text-3xl font-bold mt-2 text-emerald-700">{paidCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-orange-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Ожидают оплаты</p>
              <p className="text-3xl font-bold mt-2 text-orange-700">{unpaidCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            {t.common.find}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => { setSearchResults(null); setSearch(''); }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t.common.cancel}
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : displayBoxes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">
              {searchResults !== null ? t.common.notFound : t.common.noData}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayBoxes.map((box) => (
            <div key={box.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-slate-900">{box.boxCode}</span>
                  {box.billableWeight && (
                    <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-500">{Number(box.billableWeight).toFixed(2)} кг</span>
                  )}
                </div>
                <div className="text-right">
                  {box.finalPrice && (
                    <span className="text-lg font-bold text-slate-900">
                      ${Number(box.finalPrice).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {box.customer && (
                    <>
                      <span className="font-medium text-slate-700">{box.customer.clientCode}</span>
                      {' — '}
                      {box.customer.fullName}
                      <span className="ml-2 text-slate-400">{box.customer.phone}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {box.payment ? (
                    <>
                      <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                        Оплачено ({box.payment.method})
                      </span>
                      <button
                        onClick={() => handleDeliver(box.id)}
                        disabled={deliveringId === box.id}
                        className="rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {deliveringId === box.id ? '...' : t.warehouse.pickup}
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
                      className="rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                    >
                      {t.common.confirm}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.common.confirm}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {payTarget.boxCode} — {payTarget.customer?.fullName}
              {payTarget.finalPrice && (
                <span className="ml-2 font-medium text-slate-900">
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
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Способ оплаты</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.common.amount}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.common.currency}</label>
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
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
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handlePay}
                disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                className="flex-1 rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {paying ? t.common.saving : t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
