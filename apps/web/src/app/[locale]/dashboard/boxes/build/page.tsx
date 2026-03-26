'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Parcel {
  id: string;
  tracking: string;
  marketplace: string | null;
  weight: number | null;
  warehouse?: { id: string; name: string } | null;
}

interface ParcelsResponse {
  data: Parcel[];
  total: number;
}

export default function BuildBoxPage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<ParcelsResponse>('/me/parcels?status=STORED&limit=100')
      .then((res) => setParcels(res.data || []))
      .catch((err) => setError(err.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  // Group parcels by warehouse
  const grouped = parcels.reduce<Record<string, { name: string; parcels: Parcel[] }>>((acc, p) => {
    const whId = p.warehouse?.id || 'unknown';
    const whName = p.warehouse?.name || 'Неизвестный склад';
    if (!acc[whId]) acc[whId] = { name: whName, parcels: [] };
    acc[whId].parcels.push(p);
    return acc;
  }, {});

  // Determine which warehouse is currently selected (based on first selection)
  const selectedParcels = parcels.filter((p) => selected.has(p.id));
  const selectedWarehouseId = selectedParcels[0]?.warehouse?.id || null;

  const toggleParcel = (parcel: Parcel) => {
    const next = new Set(selected);
    if (next.has(parcel.id)) {
      next.delete(parcel.id);
    } else {
      // Only allow same warehouse
      if (selectedWarehouseId && parcel.warehouse?.id !== selectedWarehouseId) {
        return; // different warehouse, ignore
      }
      next.add(parcel.id);
    }
    setSelected(next);
  };

  const totalWeight = selectedParcels.reduce((sum, p) => sum + (p.weight || 0), 0);

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/me/boxes', {
        method: 'POST',
        body: JSON.stringify({
          parcelIds: Array.from(selected),
          customerNote: customerNote || undefined,
        }),
      });
      router.push('/ru/dashboard/boxes');
    } catch (err: any) {
      setError(err.message || 'Ошибка создания коробки');
    } finally {
      setSubmitting(false);
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
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Собрать коробку</h1>
      <p className="text-sm text-gray-500 mb-6">Выберите посылки для упаковки. Можно выбрать только посылки с одного склада.</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {parcels.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Нет доступных посылок для упаковки</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([whId, group]) => {
            const isDisabled = selectedWarehouseId !== null && selectedWarehouseId !== whId && selected.size > 0;
            return (
              <div key={whId} className={`rounded-xl border bg-white shadow-sm ${isDisabled ? 'opacity-50' : ''}`}>
                <div className="px-5 py-3 border-b bg-gray-50 rounded-t-xl">
                  <h2 className="font-semibold text-gray-700">{group.name}</h2>
                  <p className="text-xs text-gray-400">{group.parcels.length} посылок</p>
                </div>
                <div className="divide-y">
                  {group.parcels.map((p) => {
                    const isSelected = selected.has(p.id);
                    const disabled = isDisabled;
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          disabled ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => toggleParcel(p)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.tracking}</p>
                          <p className="text-xs text-gray-500">{p.marketplace || '—'}</p>
                        </div>
                        <span className="text-sm text-gray-600">{p.weight ? `${p.weight} кг` : '—'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Выбрано посылок</p>
                <p className="text-2xl font-bold">{selected.size}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Общий вес</p>
                <p className="text-2xl font-bold">{totalWeight.toFixed(2)} кг</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Примечание (необязательно)
              </label>
              <textarea
                id="note"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Дополнительные пожелания..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={selected.size === 0 || submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Создание...' : 'Собрать'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
