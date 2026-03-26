'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
      setError(err.message || 'Ошибка упаковки');
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Очередь упаковки</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {packResult && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          <p className="font-medium">Коробка упакована!</p>
          <p>Оплачиваемый вес: {packResult.result.billableWeight} кг</p>
          <p>Итоговая цена: ${packResult.result.finalPrice}</p>
          <button
            onClick={() => setPackResult(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Закрыть
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : boxes.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Очередь упаковки пуста
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {boxes.map((box) => (
            <div key={box.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-bold text-lg">{box.boxCode}</p>
                  <p className="text-sm text-gray-600">{box.customerName}</p>
                </div>
                <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium">
                  {box.parcelCount} посылок
                </span>
              </div>

              {box.customerNote && (
                <div className="mb-3 rounded bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800">
                  Заметка: {box.customerNote}
                </div>
              )}

              <p className="text-xs text-gray-400 mb-3">
                Создано: {new Date(box.createdAt).toLocaleDateString('ru-RU')}
              </p>

              {packingId === box.id ? (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Вес (кг)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={packWeight}
                      onChange={(e) => setPackWeight(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Длина (см)</label>
                      <input
                        type="number"
                        min="0"
                        value={packLength}
                        onChange={(e) => setPackLength(e.target.value)}
                        placeholder="0"
                        className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ширина (см)</label>
                      <input
                        type="number"
                        min="0"
                        value={packWidth}
                        onChange={(e) => setPackWidth(e.target.value)}
                        placeholder="0"
                        className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Высота (см)</label>
                      <input
                        type="number"
                        min="0"
                        value={packHeight}
                        onChange={(e) => setPackHeight(e.target.value)}
                        placeholder="0"
                        className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Real-time weight calculation */}
                  {(packWeight || (packLength && packWidth && packHeight)) && (
                    <div className="rounded bg-gray-50 p-2 text-xs space-y-1">
                      <p>Фактический вес: <span className="font-medium">{actualWeight.toFixed(2)} кг</span></p>
                      <p>Объёмный вес: <span className="font-medium">{volumetricWeight.toFixed(2)} кг</span></p>
                      <p className="text-blue-700 font-medium">
                        Оплачиваемый вес: {billableWeight.toFixed(2)} кг
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPackingId(null); resetPackForm(); }}
                      className="flex-1 rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handlePack(box.id)}
                      disabled={packLoading || !packWeight}
                      className="flex-1 rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {packLoading ? 'Сохранение...' : 'Подтвердить упаковку'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setPackingId(box.id); resetPackForm(); }}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Упаковать
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
