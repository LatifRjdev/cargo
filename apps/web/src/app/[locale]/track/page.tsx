'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, locale } = useI18n();

  const handleTrack = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiFetch<any>(`/public/track/${code.trim()}`);
      setResult(data);
    } catch (e: any) {
      setError(t.track.notFound);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    REQUESTED: t.statuses.REQUESTED,
    PACKING: t.statuses.PACKED,
    PACKED: t.statuses.PACKED,
    IN_TRANSIT: t.statuses.IN_TRANSIT,
    CUSTOMS: t.statuses.CUSTOMS,
    ARRIVED: t.statuses.ARRIVED,
    READY: t.statuses.READY,
    DELIVERED: t.statuses.DELIVERED,
  };

  const statusColors: Record<string, string> = {
    REQUESTED: 'bg-slate-100 text-slate-600',
    PACKING: 'bg-amber-50 text-amber-700',
    PACKED: 'bg-amber-50 text-amber-700',
    IN_TRANSIT: 'bg-blue-50 text-blue-700',
    CUSTOMS: 'bg-orange-50 text-orange-700',
    ARRIVED: 'bg-indigo-50 text-indigo-700',
    READY: 'bg-emerald-50 text-emerald-700',
    DELIVERED: 'bg-emerald-50 text-emerald-700',
  };

  const statusDotColors: Record<string, string> = {
    REQUESTED: 'bg-slate-400',
    PACKING: 'bg-amber-400',
    PACKED: 'bg-amber-500',
    IN_TRANSIT: 'bg-blue-500',
    CUSTOMS: 'bg-orange-500',
    ARRIVED: 'bg-indigo-500',
    READY: 'bg-emerald-500',
    DELIVERED: 'bg-emerald-600',
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">

      {/* Logo / Brand */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">{t.track.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.track.subtitle}</p>
        </div>
      </div>

      {/* Search Card */}
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              placeholder={t.track.placeholder}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{t.track.searching}</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <span>{t.track.find}</span>
                </>
              )}
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">{t.track.notFound}</p>
                <p className="text-xs text-red-500 mt-0.5">{t.track.checkCodeHint}</p>
              </div>
            </div>
          )}
        </div>

        {/* Result Card */}
        {result && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Result Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t.track.boxCode}</p>
                  <p className="text-sm font-semibold font-mono text-slate-900">{result.boxCode}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[result.status] || 'bg-slate-100 text-slate-600'}`}>
                {statusLabels[result.status] || result.status}
              </span>
            </div>

            {/* Status Timeline */}
            {result.statusLog && result.statusLog.length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.track.statusHistory}</p>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" />
                  <div className="space-y-4">
                    {result.statusLog.map((log: any, i: number) => (
                      <div key={i} className="relative flex items-start gap-4 pl-1">
                        <div className={`relative z-10 mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-white shadow-sm ${i === 0 ? (statusDotColors[log.status] || 'bg-blue-500') : 'bg-slate-300'}`} />
                        <div className="min-w-0 flex-1 pb-0.5">
                          <p className={`text-sm font-medium ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                            {statusLabels[log.status] || log.status}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {new Date(log.createdAt).toLocaleString(locale === 'tg' ? 'tg' : 'ru')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <p className="mt-8 text-sm text-slate-400">
        {t.track.hasAccount}{' '}
        <a href={`/${locale}/login`} className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
          {t.track.loginLink}
        </a>
      </p>
    </div>
  );
}
