'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Box {
  id: string;
  boxCode: string;
  status: string;
  weight: number | null;
  price: number | null;
  createdAt: string;
  parcels?: any[];
}

interface BoxesResponse {
  data: Box[];
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Создана',
  PACKING: 'Упаковка',
  SHIPPED: 'В пути',
  ARRIVED: 'Прибыла',
  DELIVERED: 'Выдана',
};

const STATUSES = ['all', 'CREATED', 'PACKING', 'SHIPPED', 'ARRIVED', 'DELIVERED'] as const;

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const params = filter === 'all' ? '' : `&status=${filter}`;
    apiFetch<BoxesResponse>(`/me/boxes?page=1&limit=20${params}`)
      .then((res) => setBoxes(res.data || []))
      .catch((err) => setError(err.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои коробки</h1>
        <Link
          href="/ru/dashboard/boxes/build"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Собрать коробку
        </Link>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Все' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : boxes.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
          </svg>
          <p className="mt-4 text-gray-500">Коробок пока нет</p>
          <Link
            href="/ru/dashboard/boxes/build"
            className="mt-4 inline-block text-blue-600 hover:underline text-sm"
          >
            Собрать первую коробку
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => (
            <div key={box.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-900">{box.boxCode}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  box.status === 'SHIPPED' ? 'bg-amber-100 text-amber-700' :
                  box.status === 'ARRIVED' ? 'bg-green-100 text-green-700' :
                  box.status === 'DELIVERED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {STATUS_LABELS[box.status] || box.status}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Вес</span>
                  <span className="text-gray-700">{box.weight ? `${box.weight} кг` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Цена</span>
                  <span className="text-gray-700">{box.price ? `$${box.price}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Посылок</span>
                  <span className="text-gray-700">{box.parcels?.length ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Дата</span>
                  <span className="text-gray-700">{new Date(box.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
