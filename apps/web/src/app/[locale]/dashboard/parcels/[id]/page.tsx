'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

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

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Принята',
  STORED: 'На складе',
  IN_BOX: 'В коробке',
  SHIPPED: 'Отправлена',
  DELIVERED: 'Доставлена',
};

export default function ParcelDetailPage() {
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
      .catch((err) => setError(err.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Посылка не найдена'}</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">
          Назад
        </button>
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
        Назад к посылкам
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">{parcel.tracking}</h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                parcel.status === 'STORED' ? 'bg-green-100 text-green-700' :
                parcel.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' :
                parcel.status === 'IN_BOX' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {STATUS_LABELS[parcel.status] || parcel.status}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Маркетплейс</p>
                <p className="font-medium">{parcel.marketplace || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Категория</p>
                <p className="font-medium">{parcel.category || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Склад</p>
                <p className="font-medium">{parcel.warehouse?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Вес</p>
                <p className="font-medium">{parcel.weight ? `${parcel.weight} кг` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Размеры (ДxШxВ)</p>
                <p className="font-medium">
                  {parcel.length && parcel.width && parcel.height
                    ? `${parcel.length} x ${parcel.width} x ${parcel.height} см`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Дата</p>
                <p className="font-medium">{new Date(parcel.createdAt).toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
            {parcel.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 text-sm mb-1">Описание</p>
                <p className="text-sm">{parcel.description}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {parcel.photos && parcel.photos.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Фото</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {parcel.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                  >
                    <img src={photo} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Damage info */}
          {parcel.damaged && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-lg font-semibold text-red-700 mb-2">Повреждение</h2>
              <p className="text-sm text-red-600">{parcel.damageDescription || 'Посылка повреждена'}</p>
              {parcel.damagePhotos && parcel.damagePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {parcel.damagePhotos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(photo)}
                      className="aspect-square rounded-lg overflow-hidden border border-red-200 hover:opacity-80 transition-opacity"
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
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">История статусов</h2>
            {parcel.statusLog && parcel.statusLog.length > 0 ? (
              <div className="space-y-0">
                {parcel.statusLog.map((entry, i) => (
                  <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
                    {i < parcel.statusLog.length - 1 && (
                      <div className="absolute left-[9px] top-5 w-0.5 h-full bg-gray-200" />
                    )}
                    <div className={`relative z-10 mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      i === 0 ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                    }`}>
                      {i === 0 && (
                        <svg className="w-3 h-3 text-white m-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                      <p className="text-xs text-gray-500">{new Date(entry.changedAt).toLocaleString('ru-RU')}</p>
                      {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Нет записей</p>
            )}
          </div>
        </div>
      </div>

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Увеличенное фото"
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20"
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
