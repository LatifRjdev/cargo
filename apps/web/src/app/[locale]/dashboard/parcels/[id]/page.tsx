'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface StatusLogEntry {
  status: string;
  changedAt: string;
  note?: string;
}

interface ParcelDetail {
  id: string;
  tracking: string;
  marketplace: string | null;
  category: string | null;
  description: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  status: string;
  photos: string[];
  statusLog: StatusLogEntry[];
  damaged: boolean;
  damageDescription: string | null;
  damagePhotos: string[];
  warehouse?: { name: string } | null;
  createdAt: string;
}

export default function ParcelDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const [parcel, setParcel] = useState<ParcelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    apiFetch<ParcelDetail>(`/me/parcels/${params.id}`)
      .then(setParcel)
      .catch((err) => setError(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600 mb-4" />
        <p className="text-sm text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4 font-medium">{error || t.common.notFound}</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">
          {t.common.back}
        </button>
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
      <div className="relative mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white shadow-lg shadow-blue-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{parcel.tracking}</h1>
            <p className="text-sm text-blue-100 mt-0.5">{t.common.details}</p>
          </div>
          <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-medium backdrop-blur-sm ${
            parcel.status === 'STORED' ? 'bg-green-500/20 text-green-100 border-green-400/30' :
            parcel.status === 'RECEIVED' ? 'bg-white/20 text-white border-white/30' :
            parcel.status === 'IN_BOX' ? 'bg-amber-500/20 text-amber-100 border-amber-400/30' :
            'bg-white/20 text-white border-white/30'
          }`}>
            {t.statuses[parcel.status as keyof typeof t.statuses] || parcel.status}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 space-y-6">
          {/* Info cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 shadow-sm hover:shadow-md transition-shadow p-4">
              <p className="text-xs text-slate-500 mb-1">{t.parcels.marketplace}</p>
              <p className="font-semibold text-slate-900">{parcel.marketplace || '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-green-500 shadow-sm hover:shadow-md transition-shadow p-4">
              <p className="text-xs text-slate-500 mb-1">{t.common.weight}</p>
              <p className="font-semibold text-slate-900">{parcel.weight ? `${parcel.weight} кг` : '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 shadow-sm hover:shadow-md transition-shadow p-4">
              <p className="text-xs text-slate-500 mb-1">{t.parcels.category}</p>
              <p className="font-semibold text-slate-900">{parcel.category || '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-purple-500 shadow-sm hover:shadow-md transition-shadow p-4">
              <p className="text-xs text-slate-500 mb-1">{t.nav.warehouse}</p>
              <p className="font-semibold text-slate-900">{parcel.warehouse?.name || '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-cyan-500 shadow-sm hover:shadow-md transition-shadow p-4">
              <p className="text-xs text-slate-500 mb-1">{t.parcels.dimensions}</p>
              <p className="font-semibold text-slate-900">
                {parcel.length && parcel.width && parcel.height
                  ? `${parcel.length} x ${parcel.width} x ${parcel.height} см`
                  : '—'}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-rose-500 shadow-sm hover:shadow-md transition-shadow p-4">
              <p className="text-xs text-slate-500 mb-1">{t.common.date}</p>
              <p className="font-semibold text-slate-900">{new Date(parcel.createdAt).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>

          {parcel.description && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-6">
              <p className="text-slate-500 text-sm mb-1">{t.parcels.description}</p>
              <p className="text-sm text-slate-900">{parcel.description}</p>
            </div>
          )}

          {/* Photos */}
          {parcel.photos && parcel.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.parcels.photos}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {parcel.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity shadow-sm"
                  >
                    <img src={photo} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Damage info */}
          {parcel.damaged && (
            <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-red-700">{t.parcels.damaged}</h2>
              </div>
              <p className="text-sm text-red-600">{parcel.damageDescription || t.parcels.damaged}</p>
              {parcel.damagePhotos && parcel.damagePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {parcel.damagePhotos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden border border-red-200 hover:opacity-80 transition-opacity"
                    >
                      <img src={photo} alt={`Повреждение ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column - Status timeline */}
        <div className="lg:w-80">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.parcels.statusLog}</h2>
            {parcel.statusLog && parcel.statusLog.length > 0 ? (
              <div className="space-y-0">
                {parcel.statusLog.map((entry, i) => (
                  <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
                    {i < parcel.statusLog.length - 1 && (
                      <div className="absolute left-[9px] top-5 w-0.5 h-full bg-slate-200" />
                    )}
                    <div className={`relative z-10 mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      i === 0 ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}>
                      {i === 0 && (
                        <svg className="w-3 h-3 text-white m-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.statuses[entry.status as keyof typeof t.statuses] || entry.status}</p>
                      <p className="text-xs text-slate-500">{new Date(entry.changedAt).toLocaleString('ru-RU')}</p>
                      {entry.note && <p className="text-xs text-slate-400 mt-0.5">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">{t.common.noData}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative rounded-2xl shadow-2xl overflow-hidden max-w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Увеличенное фото"
              className="max-w-full max-h-[90vh] rounded-2xl"
            />
          </div>
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
