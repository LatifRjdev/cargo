'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface QrData {
  qrCode: string; // base64 data URL
  clientCode: string;
}

export default function QrCodePage() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<QrData>('/me/qr')
      .then(setQrData)
      .catch((err) => setError(err.message || 'Ошибка загрузки QR-кода'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/me/qr/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Ошибка скачивания');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${qrData?.clientCode || 'code'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Ошибка скачивания PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Мой QR-код</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="max-w-sm mx-auto">
        <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
          {qrData?.qrCode && (
            <div className="mb-6">
              <img
                src={qrData.qrCode}
                alt="QR-код"
                className="w-64 h-64 mx-auto rounded-lg"
              />
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Ваш клиентский код</p>
            <p className="text-3xl font-bold font-mono text-blue-600">
              {qrData?.clientCode || user?.clientCode || '—'}
            </p>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Покажите этот QR-код на складе для идентификации ваших посылок
          </p>

          <button
            onClick={handleDownloadPdf}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Скачать PDF
          </button>
        </div>
      </div>
    </div>
  );
}
