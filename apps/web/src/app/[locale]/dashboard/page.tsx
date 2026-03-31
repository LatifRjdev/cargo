'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface Profile {
  id: string;
  fullName: string | null;
  phone: string;
  clientCode: string | null;
}

interface Parcel {
  id: string;
  trackingNumber: string | null;
  description: string | null;
  marketplace: string | null;
  status: string;
  createdAt: string;
  receivedAt: string | null;
}

interface Box {
  id: string;
  boxCode: string;
  status: string;
  finalPrice: number | null;
  currency: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  WAITING: 'bg-amber-50 text-amber-700',
  RECEIVED: 'bg-blue-50 text-blue-700',
  STORED: 'bg-blue-50 text-blue-700',
  IN_BOX: 'bg-indigo-50 text-indigo-700',
  REJECTED: 'bg-red-50 text-red-700',
  REQUESTED: 'bg-amber-50 text-amber-700',
  PACKED: 'bg-blue-50 text-blue-700',
  IN_TRANSIT: 'bg-emerald-50 text-emerald-700',
  CUSTOMS: 'bg-purple-50 text-purple-700',
  ARRIVED: 'bg-teal-50 text-teal-700',
  READY: 'bg-violet-50 text-violet-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<Profile>('/me/profile'),
      apiFetch<any>('/me/parcels?limit=5'),
      apiFetch<any>('/me/boxes?limit=10'),
    ])
      .then(([prof, parcelsRes, boxesRes]) => {
        setProfile(prof);
        setParcels(parcelsRes.items || parcelsRes.data || []);
        setBoxes(boxesRes.items || boxesRes.data || []);
      })
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.fullName || user?.fullName || t.customer.clientRole;
  const clientCode = profile?.clientCode || user?.clientCode || null;

  const dateLocale = locale === 'tg' ? 'tg-TJ' : 'ru-RU';
  const dateStr = new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const basePath = `/${locale}/dashboard`;

  // Stats
  const storedParcels = parcels.filter(p => ['RECEIVED', 'STORED'].includes(p.status)).length;
  const transitBoxes = boxes.filter(b => ['IN_TRANSIT', 'CUSTOMS'].includes(b.status)).length;
  const readyBoxes = boxes.filter(b => b.status === 'READY').length;
  const unidentified = parcels.filter(p => p.status === 'WAITING').length;

  // Total counts from API (may be more than loaded)
  const totalParcels = parcels.length;
  const totalBoxes = boxes.length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return { day: t.customer.today, time: d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) };
    if (diff === 1) return { day: t.customer.yesterday, time: d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) };
    return { day: d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }), time: d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) };
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 md:p-8 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.customer.hello}, {displayName} 👋</h1>
            <p className="mt-1 text-blue-100 text-sm capitalize">{dateStr}</p>
            {clientCode && (
              <p className="mt-2 text-sm text-blue-200">
                {t.customer.clientCodeLabel}: <span className="font-mono font-semibold text-white bg-white/15 px-2 py-0.5 rounded-md">#{clientCode}</span>
              </p>
            )}
          </div>
          <div className="flex gap-6">
            <div className="text-center"><p className="text-3xl font-bold">{totalParcels}</p><p className="text-xs text-blue-200 mt-0.5">{t.customer.parcelsLabel}</p></div>
            <div className="w-px bg-white/20" />
            <div className="text-center"><p className="text-3xl font-bold">{totalBoxes}</p><p className="text-xs text-blue-200 mt-0.5">{t.customer.boxesLabel}</p></div>
            <div className="w-px bg-white/20" />
            <div className="text-center"><p className="text-3xl font-bold">{readyBoxes}</p><p className="text-xs text-blue-200 mt-0.5">{t.customer.readyLabel}</p></div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 hover:shadow-lg transition-all p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{t.customer.parcelsAtWarehouse}</p>
            <div className="rounded-xl bg-blue-50 p-2.5"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{storedParcels}</p>
          <p className="mt-1 text-xs text-slate-400">{t.customer.awaitingProcessing}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 hover:shadow-lg transition-all p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{t.customer.boxesInTransit}</p>
            <div className="rounded-xl bg-emerald-50 p-2.5"><svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{transitBoxes}</p>
          <p className="mt-1 text-xs text-slate-400">{t.customer.inTransport}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-violet-500 hover:shadow-lg transition-all p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{t.customer.readyForPickup}</p>
            <div className="rounded-xl bg-violet-50 p-2.5"><svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{readyBoxes}</p>
          <p className="mt-1 text-xs text-slate-400">{t.customer.canPickup}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 hover:shadow-lg transition-all p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{t.customer.claims}</p>
            <div className="rounded-xl bg-amber-50 p-2.5"><svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{unidentified}</p>
          <p className="mt-1 text-xs text-slate-400">{t.customer.activeRequests}</p>
        </div>
      </div>

      {/* Bottom Grid: Recent Parcels + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Parcels */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">{t.customer.recentParcels}</h2>
            <a href={`${basePath}/parcels`} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">{t.customer.viewAll}</a>
          </div>
          <div className="divide-y divide-slate-100">
            {parcels.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <p className="text-sm text-slate-400">{t.common.noData}</p>
              </div>
            ) : (
              parcels.slice(0, 5).map((parcel) => {
                const dt = formatDate(parcel.receivedAt || parcel.createdAt);
                return (
                  <a key={parcel.id} href={`${basePath}/parcels/${parcel.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="text-center shrink-0 w-14">
                      <p className="text-xs font-semibold text-slate-900">{dt.day}</p>
                      <p className="text-[10px] text-slate-400">{dt.time}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{parcel.description || parcel.marketplace || parcel.trackingNumber || 'Посылка'}</p>
                      <p className="text-xs text-slate-400">{t.customer.trackingLabel}: {parcel.trackingNumber || '—'}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${statusColors[parcel.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t.statuses[parcel.status as keyof typeof t.statuses] || parcel.status}
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">{t.customer.quickActions}</h2>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { href: `${basePath}/parcels`, label: t.customer.myParcels, sub: t.customer.viewAndTrack, color: 'blue', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { href: `${basePath}/boxes`, label: t.customer.myBoxes, sub: t.customer.deliveryStatus, color: 'emerald', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8' },
              { href: `${basePath}/qr`, label: t.customer.qrTitle, sub: t.customer.forIdentification, color: 'violet', icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7z' },
              { href: `${basePath}/calculator`, label: t.nav.calculator, sub: t.customer.costCalculation, color: 'amber', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { href: `${basePath}/addresses`, label: t.customer.warehouseAddresses, sub: t.customer.whereToSend, color: 'indigo', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
            ].map((a) => (
              <a key={a.href} href={a.href} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-${a.color}-50 transition-colors group`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-${a.color}-100 text-${a.color}-600 group-hover:bg-${a.color}-200 transition-colors`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
                </div>
                <div><p className="text-sm font-medium text-slate-700">{a.label}</p><p className="text-xs text-slate-400">{a.sub}</p></div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
