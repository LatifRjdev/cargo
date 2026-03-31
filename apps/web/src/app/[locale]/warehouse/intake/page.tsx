'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

const QrScanner = dynamic(() => import('@/components/qr-scanner'), { ssr: false });

const marketplaces = ['Taobao', '1688', 'Pinduoduo', 'Poizon', 'Другое'];
const categories = [
  'Одежда',
  'Обувь',
  'Электроника',
  'Косметика',
  'Аксессуары',
  'Бытовая техника',
  'Игрушки',
  'Прочее',
];

interface IntakeResult {
  id: string;
  trackingCode: string;
  cell: string;
}

export default function IntakePage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const stepLabels = [t.admin.customer, t.parcels.marketplace, t.common.weight, t.common.details];
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'identified' | 'unidentified'>('identified');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState('');

  // Form fields
  const [clientCode, setClientCode] = useState('');
  const [phoneOnLabel, setPhoneOnLabel] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [fragile, setFragile] = useState(false);
  const [damaged, setDamaged] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleQrScan = useCallback((result: string) => {
    setShowScanner(false);
    // QR может содержать CD-XXXX код напрямую
    const code = result.trim();
    setClientCode(code);
    if (code) setStep(2); // auto-advance
  }, []);

  const resetForm = () => {
    setStep(1);
    setResult(null);
    setError('');
    setClientCode('');
    setPhoneOnLabel('');
    setMarketplace('');
    setWeight('');
    setLength('');
    setWidth('');
    setHeight('');
    setCategory('');
    setDescription('');
    setFragile(false);
    setDamaged(false);
    setDamageDescription('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        marketplace,
        weight: parseFloat(weight),
        length: parseFloat(length) || undefined,
        width: parseFloat(width) || undefined,
        height: parseFloat(height) || undefined,
        category,
        description,
        fragile,
        damaged,
        damageDescription: damaged ? damageDescription : undefined,
      };

      let endpoint: string;
      if (mode === 'identified') {
        body.clientCode = clientCode;
        endpoint = '/warehouse/parcels/intake';
      } else {
        body.phoneOnLabel = phoneOnLabel;
        endpoint = '/warehouse/parcels/intake/unidentified';
      }

      const data = await apiFetch<IntakeResult>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t.statuses.RECEIVED}!</h2>
          <div className="space-y-2 text-sm text-slate-500 mb-6">
            <p>Трекинг: <span className="font-mono font-bold text-slate-900">{result.trackingCode}</span></p>
            <p>Ячейка: <span className="font-bold text-amber-600">{result.cell}</span></p>
          </div>
          <button
            onClick={resetForm}
            className="w-full rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            {t.common.next}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Styled Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.warehouse.intake}</h1>
              <p className="text-amber-100 text-sm mt-0.5">{t.warehouse.receiveNewParcels}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('identified'); resetForm(); }}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            mode === 'identified'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
              : 'bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t.admin.code}
        </button>
        <button
          onClick={() => { setMode('unidentified'); resetForm(); }}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            mode === 'unidentified'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
              : 'bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t.warehouse.unidentified}
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s === step
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
                    : s < step
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${s === step ? 'text-amber-600' : s < step ? 'text-emerald-600' : 'text-slate-400'}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 4 && <div className={`w-8 h-0.5 mb-4 ${s < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              {mode === 'identified' ? t.admin.code : t.common.phone}
            </h3>
            {mode === 'identified' ? (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Код клиента (CD-XXXX)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    placeholder="CD-0001"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100 transition-colors"
                    title="Сканировать QR"
                  >
                    📷
                  </button>
                </div>
                {showScanner && (
                  <QrScanner
                    onScan={handleQrScan}
                    onClose={() => setShowScanner(false)}
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Телефон на этикетке</label>
                <input
                  type="text"
                  value={phoneOnLabel}
                  onChange={(e) => setPhoneOnLabel(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={mode === 'identified' ? !clientCode : !phoneOnLabel}
              className="w-full rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.common.next}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t.parcels.marketplace}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.parcels.marketplace}</label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              >
                <option value="">Выберите маркетплейс</option>
                {marketplaces.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.common.back}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!marketplace}
                className="flex-1 rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.common.next}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t.common.weight}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Вес (кг)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Длина (см)</label>
                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Ширина (см)</label>
                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Высота (см)</label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.common.back}
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!weight}
                className="flex-1 rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.common.next}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t.common.details}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.parcels.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              >
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.common.description}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Краткое описание содержимого"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                  className="rounded border-slate-300"
                />
                {t.parcels.fragile}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={damaged}
                  onChange={(e) => setDamaged(e.target.checked)}
                  className="rounded border-slate-300"
                />
                {t.parcels.damaged}
              </label>
            </div>
            {damaged && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Описание повреждения</label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={2}
                  placeholder="Опишите повреждение"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.common.back}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !category}
                className="flex-1 rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t.common.saving : t.common.confirm}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
