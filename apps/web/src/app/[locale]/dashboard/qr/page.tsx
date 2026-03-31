'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface QrData {
  qrCode: string; // base64 data URL
  clientCode: string;
}

export default function QrCodePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<QrData>('/me/qr')
      .then(setQrData)
      .catch((err) => setError(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const res = await fetch(`${API_URL}/me/qr/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(t.common.error);
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
      setError(err.message || t.common.error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600 mb-4" />
        <p className="text-sm text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Styled header section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-6 text-white shadow-lg shadow-teal-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <h1 className="text-2xl font-bold">{t.customer.qrTitle}</h1>
          <p className="text-sm text-teal-100 mt-1">{t.customer.forIdentification}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-teal-500 shadow-sm hover:shadow-md transition-all p-8 text-center">
          {qrData?.qrCode && (
            <div className="mb-6">
              <div className="inline-block p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner">
                <img
                  src={qrData.qrCode}
                  alt="QR-код"
                  className="w-56 h-56 mx-auto rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-1">{t.customer.clientCodeLabel}</p>
            <p className="text-3xl font-bold font-mono bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
              {qrData?.clientCode || user?.clientCode || '—'}
            </p>
          </div>

          <div className="mb-6 p-3 rounded-xl bg-teal-50/50 border border-teal-100">
            <div className="flex items-center justify-center gap-2 text-xs text-teal-700">
              <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.customer.qrSubtitle}
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 shadow-sm shadow-teal-200 px-4 py-3 text-sm font-semibold text-white hover:from-teal-700 hover:to-teal-800 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t.customer.downloadPdf}
          </button>
        </div>
      </div>
    </div>
  );
}
