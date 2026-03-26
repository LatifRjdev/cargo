'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiFetch<any>(`/public/track/${code.trim()}`);
      setResult(data);
    } catch (e: any) {
      setError('Коробка не найдена');
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    REQUESTED: 'Запрошена',
    PACKING: 'Упаковывается',
    PACKED: 'Упакована',
    IN_TRANSIT: 'В пути',
    CUSTOMS: 'Таможня',
    ARRIVED: 'Прибыла',
    READY: 'Готова к выдаче',
    DELIVERED: 'Выдана',
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-3xl font-bold">Отследить коробку</h1>
      <p className="mb-8 text-gray-500">Введите код коробки для отслеживания</p>

      <div className="w-full max-w-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            placeholder="BX-20260326-0001"
            className="flex-1 rounded-lg border px-4 py-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleTrack}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '...' : 'Найти'}
          </button>
        </div>

        {error && <p className="mt-4 text-center text-red-500">{error}</p>}

        {result && (
          <div className="mt-6 rounded-lg border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{result.boxCode}</h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {statusLabels[result.status] || result.status}
              </span>
            </div>

            {result.statusLog && result.statusLog.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">История статусов</h3>
                {result.statusLog.map((log: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">{statusLabels[log.status] || log.status}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString('ru')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <a href="/ru/login" className="mt-8 text-sm text-blue-600 hover:underline">
        Войти в личный кабинет
      </a>
    </div>
  );
}
