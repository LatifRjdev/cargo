'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

export default function AddressesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Warehouse[]>('/warehouses')
      .then(setWarehouses)
      .catch((err) => setError(err.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const copyAddress = async (warehouse: Warehouse) => {
    try {
      await navigator.clipboard.writeText(warehouse.address);
      setCopiedId(warehouse.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = warehouse.address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(warehouse.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Адреса складов</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {warehouses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Склады не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((wh) => (
            <div key={wh.id} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-lg bg-blue-50 p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{wh.name}</h3>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div>
                  <p className="text-gray-500 text-xs">Адрес</p>
                  <p className="text-gray-700">{wh.address}</p>
                </div>
                {wh.phone && (
                  <div>
                    <p className="text-gray-500 text-xs">Телефон</p>
                    <p className="text-gray-700">{wh.phone}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => copyAddress(wh)}
                className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  copiedId === wh.id
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {copiedId === wh.id ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Скопировано
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Копировать адрес
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
