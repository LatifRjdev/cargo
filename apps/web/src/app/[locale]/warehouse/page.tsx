'use client';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { useParams } from 'next/navigation';

export default function WarehouseDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const params = useParams();
  const locale = (params.locale as string) || 'ru';

  const firstName = (user?.fullName || t.warehouse.employee).split(' ')[0];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 md:p-8 text-white shadow-xl shadow-orange-500/20">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-16 -bottom-10 h-32 w-32 rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute left-1/2 -top-4 h-24 w-24 rounded-full bg-white/[0.05]" />

        <div className="relative">
          <p className="text-lg md:text-xl font-bold">
            {'\u{1F44B}'} {t.warehouse.welcome}, {firstName}!
          </p>
          <p className="mt-1.5 text-sm text-white/80 font-medium">
            {t.warehouse.warehouseGuangzhou} — {t.warehouse.warehouseDescription}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-3 mb-8">
        {/* Received today */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 group-hover:scale-110 transition-transform duration-200">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{t.warehouse.receivedToday}</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-0.5">0</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {t.warehouse.currentShift}
          </div>
        </div>

        {/* Unidentified */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-400 to-red-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 group-hover:scale-110 transition-transform duration-200">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{t.nav.unidentified}</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-0.5">0</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-400 font-semibold">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            {t.warehouse.needsAttention}
          </div>
        </div>

        {/* Packing queue */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform duration-200">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{t.warehouse.packingQueue}</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-0.5">0</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.warehouse.awaitingProcessing}
          </div>
        </div>
      </div>

      {/* Two-column section: Today's intake + Packing queue */}
      <div className="grid gap-5 lg:grid-cols-2 mb-8">
        {/* Today's intake list */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-800">{t.warehouse.todayIntake}</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">0 {t.warehouse.pcs}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 mb-3">
              <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-medium">{t.warehouse.noParcelsToday}</p>
            <p className="text-xs text-slate-300 mt-1">{t.warehouse.newParcelsAppear}</p>
          </div>
        </div>

        {/* Packing queue preview */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-800">{t.warehouse.packingQueue}</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">0 {t.warehouse.pcs}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 mb-3">
              <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 5v8m-4-4h8" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-medium">{t.warehouse.queueEmpty}</p>
            <p className="text-xs text-slate-300 mt-1">{t.warehouse.parcelsForPacking}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-sm font-bold text-slate-800">{t.warehouse.quickActions}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Intake */}
          <a
            href={`/${locale}/warehouse/intake`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
          >
            <div className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 mb-3 group-hover:scale-110 transition-transform duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-base font-bold">{t.nav.intake}</p>
              <p className="text-xs text-white/70 mt-0.5">{t.warehouse.receiveNewParcels}</p>
            </div>
          </a>

          {/* Packing */}
          <a
            href={`/${locale}/warehouse/packing`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-5 text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            <div className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 mb-3 group-hover:scale-110 transition-transform duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="text-base font-bold">{t.warehouse.packing}</p>
              <p className="text-xs text-white/70 mt-0.5">{t.warehouse.packAndPrepare}</p>
            </div>
          </a>

          {/* Pickup */}
          <a
            href={`/${locale}/warehouse/pickup`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            <div className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 mb-3 group-hover:scale-110 transition-transform duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <p className="text-base font-bold">{t.warehouse.pickup}</p>
              <p className="text-xs text-white/70 mt-0.5">{t.warehouse.giveToClients}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
