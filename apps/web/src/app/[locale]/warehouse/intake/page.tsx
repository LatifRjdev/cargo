'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
      setError(err.message || 'Ошибка при приёмке');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-lg border bg-white p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Посылка принята!</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>Трекинг: <span className="font-mono font-bold text-gray-900">{result.trackingCode}</span></p>
            <p>Ячейка: <span className="font-bold text-blue-600">{result.cell}</span></p>
          </div>
          <button
            onClick={resetForm}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Принять следующую
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Приёмка посылки</h1>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('identified'); resetForm(); }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'identified'
              ? 'bg-blue-600 text-white'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
        >
          По коду клиента
        </button>
        <button
          onClick={() => { setMode('unidentified'); resetForm(); }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'unidentified'
              ? 'bg-blue-600 text-white'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
        >
          Принять без кода
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 4 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {mode === 'identified' ? 'Шаг 1: Код клиента' : 'Шаг 1: Телефон на этикетке'}
            </h3>
            {mode === 'identified' ? (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Код клиента (CD-XXXX)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    placeholder="CD-0001"
                    className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="rounded-lg border bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
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
                <label className="block text-sm text-gray-600 mb-1">Телефон на этикетке</label>
                <input
                  type="text"
                  value={phoneOnLabel}
                  onChange={(e) => setPhoneOnLabel(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={mode === 'identified' ? !clientCode : !phoneOnLabel}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Далее
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Шаг 2: Маркетплейс</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Маркетплейс</label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!marketplace}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Шаг 3: Вес и габариты</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Вес (кг)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Длина (см)</label>
                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ширина (см)</label>
                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Высота (см)</label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!weight}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Шаг 4: Детали</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Краткое описание содержимого"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Хрупкое
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={damaged}
                  onChange={(e) => setDamaged(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Повреждено
              </label>
            </div>
            {damaged && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Описание повреждения</label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={2}
                  placeholder="Опишите повреждение"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !category}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Сохранение...' : 'Принять посылку'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
