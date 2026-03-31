'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

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
  FORMING: 'bg-amber-50 text-amber-700 border border-amber-200',
  DEPARTED: 'bg-blue-50 text-blue-700 border border-blue-200',
  CUSTOMS: 'bg-orange-50 text-orange-700 border border-orange-200',
  ARRIVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  COMPLETED: 'bg-slate-50 text-slate-600 border border-slate-200',
};

const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  FORMING: { value: 'DEPARTED', label: 'Отправить' },
  DEPARTED: { value: 'CUSTOMS', label: 'На таможне' },
  CUSTOMS: { value: 'ARRIVED', label: 'Прибыла' },
  ARRIVED: { value: 'COMPLETED', label: 'Завершить' },
};

export default function ShipmentsPage() {
  const { t, locale } = useI18n();
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
      setCreateError(err.message || t.common.error);
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

  const formingCount = batches.filter((b) => b.status === 'FORMING').length;
  const inTransitCount = batches.filter((b) => b.status === 'DEPARTED' || b.status === 'CUSTOMS').length;

  return (
    <div className="space-y-6">
      {/* Styled Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.nav.shipments}</h1>
                <p className="text-amber-100 text-sm mt-0.5">{t.nav.shipments}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCreate(!showCreate);
                if (!showCreate) fetchPackedBoxes();
              }}
              className="rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
            >
              + {t.common.create}
            </button>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{batches.length}</p>
              <p className="text-amber-200 text-sm">{t.common.total}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formingCount}</p>
              <p className="text-amber-200 text-sm">{STATUS_LABELS.FORMING}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{inTransitCount}</p>
              <p className="text-amber-200 text-sm">{t.statuses.IN_TRANSIT}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t.common.total}</p>
              <p className="text-3xl font-bold mt-2 text-amber-700">{batches.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-orange-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{STATUS_LABELS.FORMING}</p>
              <p className="text-3xl font-bold mt-2 text-orange-700">{formingCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t.statuses.IN_TRANSIT}</p>
              <p className="text-3xl font-bold mt-2 text-blue-700">{inTransitCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">{t.common.create}</h3>

          {createError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {createError}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Маршрут</label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Номер транспорта</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Необязательно"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Выберите коробки ({selectedBoxIds.length} выбрано)
            </label>
            {packedBoxes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 border border-slate-200 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">{t.common.noData}</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
                {packedBoxes.map((box) => (
                  <label
                    key={box.id}
                    className={`flex items-center gap-3 rounded-lg p-2.5 cursor-pointer transition-all ${
                      selectedBoxIds.includes(box.id) ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoxIds.includes(box.id)}
                      onChange={() => toggleBox(box.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-mono text-slate-900">{box.boxCode}</span>
                    <span className="text-sm text-slate-500">
                      {box.customer?.clientCode || '—'} — {box.customer?.fullName || '—'}
                    </span>
                    {box.billableWeight && (
                      <span className="text-xs text-slate-400">{Number(box.billableWeight).toFixed(2)} кг</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || selectedBoxIds.length === 0 || !route}
              className="flex-1 rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {creating ? t.common.creating : `${t.common.create} (${selectedBoxIds.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Batches list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">{t.common.noData}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => {
            const next = NEXT_STATUS[batch.status];
            const isExpanded = expandedId === batch.id;

            return (
              <div key={batch.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-t-2xl"
                  onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-mono font-medium text-slate-900">{batch.batchCode}</p>
                      <p className="text-sm text-slate-500">{batch.route}</p>
                    </div>
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[batch.status] || 'bg-slate-100 border border-slate-200'}`}>
                      {STATUS_LABELS[batch.status] || batch.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-slate-600">{batch.totalBoxes} коробок</p>
                      {batch.totalWeight && (
                        <p className="text-slate-400">{Number(batch.totalWeight).toFixed(2)} кг</p>
                      )}
                    </div>
                    {next && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(batch.id, next.value);
                        }}
                        disabled={updatingId === batch.id}
                        className="rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {updatingId === batch.id ? '...' : next.label}
                      </button>
                    )}
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {batch.vehicleNumber && (
                      <p className="text-sm text-slate-600 mb-2">Транспорт: <span className="font-medium">{batch.vehicleNumber}</span></p>
                    )}
                    {batch.departedAt && (
                      <p className="text-sm text-slate-500 mb-1">
                        Отправлена: {new Date(batch.departedAt).toLocaleString(locale === 'tg' ? 'tg-TJ' : 'ru-RU')}
                      </p>
                    )}
                    {batch.arrivedAt && (
                      <p className="text-sm text-slate-500 mb-1">
                        Прибыла: {new Date(batch.arrivedAt).toLocaleString(locale === 'tg' ? 'tg-TJ' : 'ru-RU')}
                      </p>
                    )}

                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-3 mb-2">
                      Коробки ({batch.boxes.length})
                    </h4>
                    <div className="space-y-1">
                      {batch.boxes.map((box) => (
                        <div key={box.id} className="flex items-center justify-between text-sm rounded-lg bg-slate-50/80 border border-slate-100 px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-900">{box.boxCode}</span>
                            <span className="text-slate-500">
                              {box.customer?.clientCode} — {box.customer?.fullName}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            {box.billableWeight && <span>{Number(box.billableWeight).toFixed(2)} кг</span>}
                            {box.finalPrice && <span className="ml-2 font-medium text-slate-600">${Number(box.finalPrice).toFixed(2)}</span>}
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
