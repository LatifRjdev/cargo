'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Box {
  id: string;
  boxCode: string;
  billableWeight: number | null;
  finalPrice: number | null;
  currency: string;
  customer: { fullName: string; clientCode: string } | null;
}

interface Batch {
  id: string;
  batchCode: string;
  status: string;
  route: string;
  vehicleNumber: string | null;
  totalBoxes: number;
  totalWeight: number | null;
  departedAt: string | null;
  arrivedAt: string | null;
  createdAt: string;
  boxes: Box[];
}

interface BatchesResponse {
  items: Batch[];
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  FORMING: 'Формируется',
  DEPARTED: 'В пути',
  CUSTOMS: 'Таможня',
  ARRIVED: 'Прибыла',
  COMPLETED: 'Завершена',
};

const STATUS_COLORS: Record<string, string> = {
  FORMING: 'bg-yellow-100 text-yellow-800',
  DEPARTED: 'bg-blue-100 text-blue-800',
  CUSTOMS: 'bg-orange-100 text-orange-800',
  ARRIVED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  FORMING: { value: 'DEPARTED', label: 'Отправить' },
  DEPARTED: { value: 'CUSTOMS', label: 'На таможне' },
  CUSTOMS: { value: 'ARRIVED', label: 'Прибыла' },
  ARRIVED: { value: 'COMPLETED', label: 'Завершить' },
};

export default function ShipmentsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form
  const [route, setRoute] = useState('Guangzhou → Urumqi → Dushanbe');
  const [vehicle, setVehicle] = useState('');
  const [packedBoxes, setPackedBoxes] = useState<Box[]>([]);
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Status update
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<BatchesResponse>('/shipments?limit=50');
      setBatches(data.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchPackedBoxes = async () => {
    try {
      const data = await apiFetch<any>('/warehouse/boxes/queue?status=PACKED');
      // packed boxes not in a batch — we get them from boxes endpoint
      const allBoxes = await apiFetch<any>('/shipments/available-boxes');
      setPackedBoxes(Array.isArray(allBoxes) ? allBoxes : []);
    } catch {
      // Fallback: just use empty
      setPackedBoxes([]);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreate = async () => {
    if (selectedBoxIds.length === 0) return;
    setCreating(true);
    setCreateError('');
    try {
      await apiFetch('/shipments', {
        method: 'POST',
        body: JSON.stringify({
          route,
          vehicleNumber: vehicle || undefined,
          boxIds: selectedBoxIds,
        }),
      });
      setShowCreate(false);
      setSelectedBoxIds([]);
      setRoute('Guangzhou → Urumqi → Dushanbe');
      setVehicle('');
      fetchBatches();
    } catch (err: any) {
      setCreateError(err.message || 'Ошибка при создании');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (batchId: string, newStatus: string) => {
    setUpdatingId(batchId);
    try {
      await apiFetch(`/shipments/${batchId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBatches();
    } catch {
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBox = (id: string) => {
    setSelectedBoxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Отправки</h1>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            if (!showCreate) fetchPackedBoxes();
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Новая отправка
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-lg border bg-white p-6">
          <h3 className="font-medium text-gray-900 mb-4">Создать отправку</h3>

          {createError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {createError}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Маршрут</label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Номер транспорта</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Необязательно"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              Выберите коробки ({selectedBoxIds.length} выбрано)
            </label>
            {packedBoxes.length === 0 ? (
              <p className="text-sm text-gray-400">Нет упакованных коробок для отправки</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
                {packedBoxes.map((box) => (
                  <label
                    key={box.id}
                    className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${
                      selectedBoxIds.includes(box.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoxIds.includes(box.id)}
                      onChange={() => toggleBox(box.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-mono">{box.boxCode}</span>
                    <span className="text-sm text-gray-500">
                      {box.customer?.clientCode || '—'} — {box.customer?.fullName || '—'}
                    </span>
                    {box.billableWeight && (
                      <span className="text-xs text-gray-400">{Number(box.billableWeight).toFixed(2)} кг</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || selectedBoxIds.length === 0 || !route}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Создание...' : `Создать (${selectedBoxIds.length} коробок)`}
            </button>
          </div>
        </div>
      )}

      {/* Batches list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Отправок пока нет</div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => {
            const next = NEXT_STATUS[batch.status];
            const isExpanded = expandedId === batch.id;

            return (
              <div key={batch.id} className="rounded-lg border bg-white">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-mono font-medium text-gray-900">{batch.batchCode}</p>
                      <p className="text-sm text-gray-500">{batch.route}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[batch.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[batch.status] || batch.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-gray-600">{batch.totalBoxes} коробок</p>
                      {batch.totalWeight && (
                        <p className="text-gray-400">{Number(batch.totalWeight).toFixed(2)} кг</p>
                      )}
                    </div>
                    {next && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(batch.id, next.value);
                        }}
                        disabled={updatingId === batch.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {updatingId === batch.id ? '...' : next.label}
                      </button>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3">
                    {batch.vehicleNumber && (
                      <p className="text-sm text-gray-600 mb-2">Транспорт: {batch.vehicleNumber}</p>
                    )}
                    {batch.departedAt && (
                      <p className="text-sm text-gray-500 mb-1">
                        Отправлена: {new Date(batch.departedAt).toLocaleString('ru-RU')}
                      </p>
                    )}
                    {batch.arrivedAt && (
                      <p className="text-sm text-gray-500 mb-1">
                        Прибыла: {new Date(batch.arrivedAt).toLocaleString('ru-RU')}
                      </p>
                    )}

                    <h4 className="text-sm font-medium text-gray-700 mt-3 mb-2">
                      Коробки ({batch.boxes.length})
                    </h4>
                    <div className="space-y-1">
                      {batch.boxes.map((box) => (
                        <div key={box.id} className="flex items-center justify-between text-sm rounded-lg bg-gray-50 px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono">{box.boxCode}</span>
                            <span className="text-gray-500">
                              {box.customer?.clientCode} — {box.customer?.fullName}
                            </span>
                          </div>
                          <div className="text-gray-400">
                            {box.billableWeight && <span>{Number(box.billableWeight).toFixed(2)} кг</span>}
                            {box.finalPrice && <span className="ml-2">${Number(box.finalPrice).toFixed(2)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
