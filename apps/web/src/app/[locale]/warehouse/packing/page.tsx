'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface BoxQueueItem {
  id: string;
  boxCode: string;
  customerName: string;
  parcelCount: number;
  customerNote: string;
  createdAt: string;
}

interface PackResult {
  finalPrice: number;
  billableWeight: number;
}

export default function PackingQueuePage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [boxes, setBoxes] = useState<BoxQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [packingId, setPackingId] = useState<string | null>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [packResult, setPackResult] = useState<{ id: string; result: PackResult } | null>(null);
  const [error, setError] = useState('');

  // Packing form fields
  const [packWeight, setPackWeight] = useState('');
  const [packLength, setPackLength] = useState('');
  const [packWidth, setPackWidth] = useState('');
  const [packHeight, setPackHeight] = useState('');

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<BoxQueueItem[]>('/warehouse/boxes/queue');
      setBoxes(data);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();
  }, []);

  const volumetricWeight =
    packLength && packWidth && packHeight
      ? (parseFloat(packLength) * parseFloat(packWidth) * parseFloat(packHeight)) / 5000
      : 0;

  const actualWeight = packWeight ? parseFloat(packWeight) : 0;
  const billableWeight = Math.max(volumetricWeight, actualWeight);

  const handlePack = async (boxId: string) => {
    if (!packWeight) return;
    setPackLoading(true);
    setError('');
    try {
      const result = await apiFetch<PackResult>(`/warehouse/boxes/${boxId}/pack`, {
        method: 'POST',
        body: JSON.stringify({
          weight: parseFloat(packWeight),
          length: parseFloat(packLength) || undefined,
          width: parseFloat(packWidth) || undefined,
          height: parseFloat(packHeight) || undefined,
        }),
      });
      setPackResult({ id: boxId, result });
      setPackingId(null);
      resetPackForm();
      fetchBoxes();
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setPackLoading(false);
    }
  };

  const resetPackForm = () => {
    setPackWeight('');
    setPackLength('');
    setPackWidth('');
    setPackHeight('');
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.warehouse.packingQueue}</h1>
              <p className="text-amber-100 text-sm mt-0.5">{t.warehouse.parcelsForPacking}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{boxes.length}</p>
              <p className="text-amber-200 text-sm">{t.warehouse.packingQueue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{t.warehouse.packingRequests}</p>
            <p className="text-3xl font-bold mt-2 text-amber-700">{boxes.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t.warehouse.awaitingProcessing}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {packResult && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.common.success}</p>
              <p className="text-sm text-slate-600">Оплачиваемый вес: {packResult.result.billableWeight} кг</p>
              <p className="text-sm text-slate-600">Итоговая цена: ${packResult.result.finalPrice}</p>
            </div>
            <button
              onClick={() => setPackResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : boxes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">{t.warehouse.queueEmpty}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {boxes.map((box) => (
            <div key={box.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-bold text-lg text-slate-900">{box.boxCode}</p>
                  <p className="text-sm text-slate-500">{box.customerName}</p>
                </div>
                <span className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                  {box.parcelCount} посылок
                </span>
              </div>

              {box.customerNote && (
                <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                  Заметка: {box.customerNote}
                </div>
              )}

              <p className="text-xs text-slate-400 mb-3">
                Создано: {new Date(box.createdAt).toLocaleDateString(locale === 'tg' ? 'tg-TJ' : 'ru-RU')}
              </p>

              {packingId === box.id ? (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Вес (кг)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={packWeight}
                      onChange={(e) => setPackWeight(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Длина (см)</label>
                      <input
                        type="number"
                        min="0"
                        value={packLength}
                        onChange={(e) => setPackLength(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Ширина (см)</label>
                      <input
                        type="number"
                        min="0"
                        value={packWidth}
                        onChange={(e) => setPackWidth(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Высота (см)</label>
                      <input
                        type="number"
                        min="0"
                        value={packHeight}
                        onChange={(e) => setPackHeight(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Real-time weight calculation */}
                  {(packWeight || (packLength && packWidth && packHeight)) && (
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs space-y-1">
                      <p className="text-slate-600">Фактический вес: <span className="font-medium text-slate-900">{actualWeight.toFixed(2)} кг</span></p>
                      <p className="text-slate-600">Объёмный вес: <span className="font-medium text-slate-900">{volumetricWeight.toFixed(2)} кг</span></p>
                      <p className="text-amber-700 font-semibold">
                        Оплачиваемый вес: {billableWeight.toFixed(2)} кг
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPackingId(null); resetPackForm(); }}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      onClick={() => handlePack(box.id)}
                      disabled={packLoading || !packWeight}
                      className="flex-1 rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {packLoading ? t.common.saving : t.common.confirm}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setPackingId(box.id); resetPackForm(); }}
                  className="w-full rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                >
                  {t.boxes.pack}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
