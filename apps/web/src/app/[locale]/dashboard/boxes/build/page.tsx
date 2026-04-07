'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Parcel {
  id: string;
  tracking: string;
  marketplace: string | null;
  weight: number | null;
  warehouse?: { id: string; name: string } | null;
}

interface ParcelsResponse {
  items?: Parcel[];
  data?: Parcel[];
  total: number;
}

export default function BuildBoxPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<ParcelsResponse>('/me/parcels?status=STORED&limit=100')
      .then((res) => setParcels(res.items || res.data || []))
      .catch((err) => setError(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, []);

  // Group parcels by warehouse
  const grouped = parcels.reduce<Record<string, { name: string; parcels: Parcel[] }>>((acc, p) => {
    const whId = p.warehouse?.id || 'unknown';
    const whName = p.warehouse?.name || t.nav.warehouse;
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
      router.push(`/${locale}/dashboard/boxes`);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600 mb-4" />
        <p className="text-sm text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.common.back}
      </button>

      {/* Styled header section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 text-white shadow-lg shadow-indigo-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <h1 className="text-2xl font-bold">{t.boxes.buildBox}</h1>
          <p className="text-sm text-indigo-100 mt-1">{t.boxes.selectParcels}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm">
          {error}
        </div>
      )}

      {parcels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">{t.common.noData}</p>
          <p className="text-sm text-slate-400 mt-1">{t.boxes.selectParcels}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([whId, group]) => {
            const isDisabled = selectedWarehouseId !== null && selectedWarehouseId !== whId && selected.size > 0;
            return (
              <div key={whId} className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all ${isDisabled ? 'opacity-50' : ''}`}>
                <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/30 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-700">{group.name}</h2>
                      <p className="text-xs text-slate-400">{group.parcels.length} посылок</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.parcels.map((p) => {
                    const isSelected = selected.has(p.id);
                    const disabled = isDisabled;
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors ${
                          disabled ? 'cursor-not-allowed' : ''
                        } ${isSelected ? 'bg-indigo-50/30' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => toggleParcel(p)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.tracking}</p>
                          <p className="text-xs text-slate-500">{p.marketplace || '—'}</p>
                        </div>
                        <span className="text-sm text-slate-600">{p.weight ? `${p.weight} кг` : '—'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-indigo-500 shadow-sm hover:shadow-md transition-all p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t.boxes.selectParcels}</p>
                  <p className="text-2xl font-bold text-slate-900">{selected.size}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">{t.common.weight}</p>
                <p className="text-2xl font-bold text-slate-900">{totalWeight.toFixed(2)} кг</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
                {t.boxes.customerNote}
              </label>
              <textarea
                id="note"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                placeholder="Дополнительные пожелания..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={selected.size === 0 || submitting}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-sm shadow-indigo-200 px-4 py-3 text-sm font-semibold text-white hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? t.common.creating : t.boxes.buildBox}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
