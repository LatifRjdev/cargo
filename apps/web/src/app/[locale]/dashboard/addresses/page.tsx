'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

export default function AddressesPage() {
  const { t } = useI18n();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Warehouse[]>('/warehouses')
      .then(setWarehouses)
      .catch((err) => setError(err.message || t.common.error))
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
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-600 mb-4" />
        <p className="text-sm text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Styled header section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-6 text-white shadow-lg shadow-emerald-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <h1 className="text-2xl font-bold">{t.customer.warehouseAddresses}</h1>
          <p className="text-sm text-emerald-100 mt-1">{t.customer.whereToSend}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm">
          {error}
        </div>
      )}

      {warehouses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">{t.common.notFound}</p>
          <p className="text-sm text-slate-400 mt-1">{t.customer.warehouseAddresses}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-2.5 flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{wh.name}</h3>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div>
                  <p className="text-slate-500 text-xs">{t.customer.warehouseAddresses}</p>
                  <p className="text-slate-700">{wh.address}</p>
                </div>
                {wh.phone && (
                  <div>
                    <p className="text-slate-500 text-xs">{t.common.phone}</p>
                    <p className="text-slate-700">{wh.phone}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => copyAddress(wh)}
                className={`w-full rounded-xl border px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  copiedId === wh.id
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50/50 shadow-sm hover:shadow-md'
                }`}
              >
                {copiedId === wh.id ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t.customer.copied}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {t.customer.copyAddress}
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
