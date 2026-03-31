'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

interface TrendPoint { date: string; intake: number; packed: number; revenue: number }
interface DashboardData {
  today: { intake: number; packed: number; shipped: number; revenue: number };
  totals: { parcels: number; boxes: number; customers: number; pendingPickup: number; unidentified: number };
  parcelsByStatus: { status: string; count: number }[];
  boxesByStatus: { status: string; count: number }[];
}

const statusColors: Record<string, string> = {
  WAITING: 'bg-amber-100 text-amber-700', RECEIVED: 'bg-blue-100 text-blue-700', STORED: 'bg-slate-100 text-slate-700', IN_BOX: 'bg-indigo-100 text-indigo-700', REJECTED: 'bg-red-100 text-red-700',
  REQUESTED: 'bg-amber-100 text-amber-700', PACKED: 'bg-blue-100 text-blue-700', IN_TRANSIT: 'bg-cyan-100 text-cyan-700', CUSTOMS: 'bg-purple-100 text-purple-700', ARRIVED: 'bg-teal-100 text-teal-700', READY: 'bg-green-100 text-green-700', DELIVERED: 'bg-emerald-100 text-emerald-700',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { locale, t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const parcelStatusLabels: Record<string, string> = { WAITING: t.statuses.WAITING, RECEIVED: t.statuses.RECEIVED, STORED: t.statuses.STORED, IN_BOX: t.statuses.IN_BOX, REJECTED: t.statuses.REJECTED };
  const boxStatusLabels: Record<string, string> = { REQUESTED: t.statuses.REQUESTED, PACKED: t.statuses.PACKED, IN_TRANSIT: t.statuses.IN_TRANSIT, CUSTOMS: t.statuses.CUSTOMS, ARRIVED: t.statuses.ARRIVED, READY: t.statuses.READY, DELIVERED: t.statuses.DELIVERED };

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t.admin.goodMorning;
    if (h < 18) return t.admin.goodAfternoon;
    return t.admin.goodEvening;
  }

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardData>('/admin/dashboard'),
      apiFetch<TrendPoint[]>('/admin/dashboard/trends?days=14'),
    ]).then(([d, t]) => { setData(d); setTrends(t); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try { setSearchResults(await apiFetch<any>(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)); } catch {} finally { setSearching(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-sm text-red-500">{t.common.error}</p>
    </div>
  );

  const localeCode = locale === 'tg' ? 'tg-TJ' : 'ru-RU';
  const dateStr = new Date().toLocaleDateString(localeCode, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const totalTrendRevenue = trends.reduce((s, t) => s + t.revenue, 0);
  const firstName = (user?.fullName || t.admin.administrator).split(' ').pop();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}, {firstName} 👋</h1>
          <p className="text-blue-100 mt-1 capitalize">{t.admin.administrator} · {dateStr}</p>
          <div className="flex flex-wrap gap-8 mt-6">
            <div><p className="text-3xl font-bold">{data.totals.parcels}</p><p className="text-blue-200 text-sm">{t.admin.totalParcels}</p></div>
            <div><p className="text-3xl font-bold">{data.totals.boxes}</p><p className="text-blue-200 text-sm">{t.admin.totalBoxes}</p></div>
            <div><p className="text-3xl font-bold">{data.totals.customers}</p><p className="text-blue-200 text-sm">{t.admin.totalCustomers}</p></div>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          <svg className="w-5 h-5 text-slate-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t.admin.quickSearch}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
          <button onClick={handleSearch} disabled={searching} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">{searching ? '...' : t.common.find}</button>
        </div>
        {searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-20 max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.admin.results}</h3>
              <button onClick={() => { setSearchResults(null); setSearchQuery(''); }} className="text-xs text-slate-400 hover:text-slate-600">{t.common.close}</button>
            </div>
            {searchResults.clients?.map((c: any) => (
              <a key={c.id} href={`/${locale}/admin/users/${c.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{(c.fullName || c.phone || '?').charAt(0).toUpperCase()}</div>
                <div><p className="text-sm font-medium text-slate-700">{c.fullName || c.phone}</p><p className="text-[11px] text-slate-400">{c.clientCode}</p></div>
              </a>
            ))}
            {searchResults.parcels?.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div><div><p className="text-sm font-mono text-slate-700">{p.trackingNumber}</p><span className={`text-[10px] font-medium rounded-md px-1.5 py-0.5 ${statusColors[p.status] || 'bg-slate-100'}`}>{parcelStatusLabels[p.status] || p.status}</span></div></div>
            ))}
            {searchResults.boxes?.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg></div><div><p className="text-sm font-mono text-slate-700">{b.boxCode}</p><span className={`text-[10px] font-medium rounded-md px-1.5 py-0.5 ${statusColors[b.status] || 'bg-slate-100'}`}>{boxStatusLabels[b.status] || b.status}</span></div></div>
            ))}
            {!searchResults.clients?.length && !searchResults.parcels?.length && !searchResults.boxes?.length && !searchResults.batches?.length && (
              <p className="text-sm text-slate-400 text-center py-4">{t.common.notFound}</p>
            )}
          </div>
        )}
      </div>

      {/* Today's Metrics -- Cards with colored top border */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t.admin.todayIntake, value: data.today.intake, sub: t.admin.parcels, color: 'blue', href: `/${locale}/admin/reports`, icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
          { label: t.admin.todayPacked, value: data.today.packed, sub: t.admin.boxesLabel, color: 'emerald', href: `/${locale}/admin/boxes`, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { label: t.admin.todayShipped, value: data.today.shipped, sub: t.admin.trips, color: 'violet', href: `/${locale}/admin/reports`, icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
          { label: t.admin.todayRevenue, value: `$${data.today.revenue.toLocaleString()}`, sub: t.admin.payments, color: 'amber', href: `/${locale}/admin/profit`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((m) => {
          const borderColor = { blue: 'border-t-blue-500', emerald: 'border-t-emerald-500', violet: 'border-t-violet-500', amber: 'border-t-amber-500' }[m.color];
          const iconBg = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600' }[m.color];
          const valueColor = { blue: 'text-blue-700', emerald: 'text-emerald-700', violet: 'text-violet-700', amber: 'text-amber-700' }[m.color];
          return (
            <a key={m.label} href={m.href} className={`block bg-white rounded-2xl border border-slate-200/80 border-t-[3px] ${borderColor} p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 cursor-pointer group`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{m.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{m.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Alerts Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.totals.pendingPickup > 0 && (
          <a href={`/${locale}/admin/boxes`} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">{t.admin.pendingPickup}</p>
              <p className="text-2xl font-bold text-amber-700">{data.totals.pendingPickup}</p>
            </div>
          </a>
        )}
        {data.totals.unidentified > 0 && (
          <a href={`/${locale}/admin/unidentified`} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-200 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">{t.admin.unidentifiedParcels}</p>
              <p className="text-2xl font-bold text-red-700">{data.totals.unidentified}</p>
            </div>
          </a>
        )}
        <a href={`/${locale}/admin/reports`} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">{t.admin.openReports}</p>
            <p className="text-xs text-blue-500">{t.admin.fullAnalytics} →</p>
          </div>
        </a>
      </div>

      {/* Charts Row */}
      {trends.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Intake & Packed */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">{t.admin.intakeAndPacking}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.admin.last14days}</p>
              </div>
              <div className="flex items-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> {t.admin.intakeLabel}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> {t.admin.packingLabel}</span>
              </div>
            </div>
            <div className="flex items-end gap-[4px] h-40">
              {trends.map((tp) => {
                const maxVal = Math.max(...trends.map((x) => Math.max(x.intake, x.packed)), 1);
                return (
                  <div key={tp.date} className="flex-1 flex gap-[2px] items-end h-full group cursor-pointer" title={`${tp.date}: ${tp.intake} / ${tp.packed}`}>
                    <div className="w-1/2 bg-blue-500 rounded-t-md transition-all group-hover:bg-blue-600 group-hover:shadow-sm" style={{ height: `${(tp.intake / maxVal) * 100}%`, minHeight: tp.intake ? 4 : 0 }} />
                    <div className="w-1/2 bg-emerald-500 rounded-t-md transition-all group-hover:bg-emerald-600 group-hover:shadow-sm" style={{ height: `${(tp.packed / maxVal) * 100}%`, minHeight: tp.packed ? 4 : 0 }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-400"><span>{trends[0]?.date.slice(5)}</span><span>{trends[trends.length - 1]?.date.slice(5)}</span></div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">{t.admin.revenue}</h2>
                <p className="text-xs text-slate-400 mt-0.5">14 {t.admin.last14days.split(' ').pop()}</p>
              </div>
              <span className="text-lg font-bold text-emerald-600">${totalTrendRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-end gap-[3px] h-40">
              {trends.map((tp) => {
                const maxRev = Math.max(...trends.map((x) => x.revenue), 1);
                return (
                  <div key={tp.date} className="flex-1 h-full flex items-end group cursor-pointer" title={`${tp.date}: $${tp.revenue}`}>
                    <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all group-hover:from-emerald-600 group-hover:to-emerald-500" style={{ height: `${(tp.revenue / maxRev) * 100}%`, minHeight: tp.revenue ? 4 : 0 }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-400"><span>{trends[0]?.date.slice(5)}</span><span>{trends[trends.length - 1]?.date.slice(5)}</span></div>
          </div>
        </div>
      )}

      {/* Status Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: t.admin.parcelsByStatus, items: data.parcelsByStatus, labels: parcelStatusLabels },
          { title: t.admin.boxesByStatus, items: data.boxesByStatus, labels: boxStatusLabels },
        ].map((section) => {
          const total = section.items.reduce((s, i) => s + i.count, 0) || 1;
          return (
            <div key={section.title} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-5">{section.title}</h2>
              {section.items.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">{t.common.noData}</p>
              ) : (
                <div className="space-y-3">
                  {section.items.map((s) => (
                    <div key={s.status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${statusColors[s.status] || 'bg-slate-100 text-slate-600'}`}>
                          {section.labels[s.status] || s.status}
                        </span>
                        <span className="text-sm font-bold text-slate-700">{s.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${(s.count / total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
