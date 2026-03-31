'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

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
  const { t } = useI18n();
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
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Styled header section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-6 text-white shadow-lg shadow-violet-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <h1 className="text-2xl font-bold">{t.customer.calcTitle}</h1>
          <p className="text-sm text-violet-100 mt-1">{t.customer.calcSubtitle}</p>
        </div>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleCalculate} className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-violet-500 shadow-sm hover:shadow-md transition-all p-6 space-y-4">
          {loadingWarehouses ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-violet-600 mb-3" />
              <p className="text-sm text-slate-400">{t.common.loading}</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-slate-700 mb-1">
                  {t.nav.warehouse}
                </label>
                <select
                  id="origin"
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
                  required
                >
                  <option value="">{t.admin.selectWarehouse}</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">
                  {t.customer.route}
                </label>
                <select
                  id="destination"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
                  required
                >
                  <option value="">{t.admin.selectWarehouse}</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-slate-700 mb-1">
              {t.customer.weightKg}
            </label>
            <input
              id="weight"
              type="number"
              step="0.01"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.parcels.dimensions}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                step="0.1"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Длина"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Ширина"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Высота"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 shadow-sm shadow-violet-200 px-4 py-3 text-sm font-semibold text-white hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? t.common.loading : t.customer.calculate}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-green-500 shadow-sm hover:shadow-md transition-all p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{t.customer.costCalculation}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">{t.common.weight}</span>
                <span className="text-sm font-medium text-slate-900">{result.actualWeight} кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">{t.parcels.dimensions}</span>
                <span className="text-sm font-medium text-slate-900">{result.volumetricWeight} кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">{t.customer.billableWeight}</span>
                <span className="text-sm font-semibold text-slate-900">{result.billableWeight} кг</span>
              </div>
              <div className="flex justify-between items-center py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 px-4 -mx-1">
                <span className="text-base font-medium text-slate-900">{t.customer.estimatedCost}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${result.price}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
