'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Warehouse {
  id: string;
  name: string;
}

interface CalcResult {
  actualWeight: number;
  volumetricWeight: number;
  billableWeight: number;
  price: number;
}

export default function CalculatorPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Warehouse[]>('/warehouses')
      .then((data) => {
        setWarehouses(data);
        if (data.length >= 2) {
          setOriginId(data[0].id);
          setDestinationId(data[1].id);
        } else if (data.length === 1) {
          setOriginId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingWarehouses(false));
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await apiFetch<CalcResult>('/public/calculate', {
        method: 'POST',
        body: JSON.stringify({
          originWarehouseId: originId,
          destinationWarehouseId: destinationId,
          weight: parseFloat(weight),
          length: length ? parseFloat(length) : undefined,
          width: width ? parseFloat(width) : undefined,
          height: height ? parseFloat(height) : undefined,
        }),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Ошибка расчёта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Калькулятор доставки</h1>

      <div className="max-w-lg">
        <form onSubmit={handleCalculate} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          {loadingWarehouses ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
                  Склад отправления
                </label>
                <select
                  id="origin"
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Склад назначения
                </label>
                <select
                  id="destination"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Вес (кг)
            </label>
            <input
              id="weight"
              type="number"
              step="0.01"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Габариты (см) — необязательно
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                step="0.1"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Длина"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Ширина"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Высота"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Расчёт...' : 'Рассчитать'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Результат расчёта</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">Фактический вес</span>
                <span className="text-sm font-medium">{result.actualWeight} кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">Объёмный вес</span>
                <span className="text-sm font-medium">{result.volumetricWeight} кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">Расчётный вес</span>
                <span className="text-sm font-semibold">{result.billableWeight} кг</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base font-medium text-gray-900">Стоимость</span>
                <span className="text-xl font-bold text-blue-600">${result.price}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
