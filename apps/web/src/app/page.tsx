'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n-context';

export default function LandingPage() {
  const [trackCode, setTrackCode] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const { t, locale } = useI18n();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

  const handleCalc = async () => {
    if (!calcWeight) return;
    setCalcLoading(true);
    try {
      const res = await fetch(`${apiUrl}/public/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: parseFloat(calcWeight) }),
      });
      if (res.ok) setCalcResult(await res.json());
    } catch {
      // silent
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* -- Header -- */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Cargo</span>
            <span className="hidden sm:block text-sm text-slate-400 font-medium">Consolidation</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href={`/${locale}/track`}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              {t.landing.headerTrack}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              {t.landing.headerLogin}
            </Link>
          </nav>
        </div>
      </header>

      {/* -- Hero -- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Background decorative shapes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-700/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-slate-800/40 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 font-medium mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              {t.landing.route}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              {t.landing.heroTitle}<br />
              <span className="text-blue-400">{t.landing.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              {t.landing.heroSubtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/register`}
                className="rounded-xl bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white hover:bg-blue-400 transition-colors shadow-lg shadow-blue-900/50"
              >
                {t.landing.register}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="rounded-xl border border-slate-600 bg-slate-800/60 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors"
              >
                {t.landing.login}
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-700/40 max-w-2xl">
            {[
              { value: '3', label: t.landing.warehouses },
              { value: '14\u201328', label: t.landing.deliveryDays },
              { value: t.landing.perKg.startsWith('от') || t.landing.perKg.startsWith('аз') ? `$2.5` : '$2.5', label: t.landing.perKg },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-800/70 px-6 py-5 text-center hover:bg-slate-800/90 transition-colors"
              >
                <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                <div className="mt-0.5 text-xs text-slate-400 font-medium uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- How it works -- */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">{t.landing.process}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t.landing.howItWorks}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: t.landing.step1Title,
                desc: t.landing.step1Desc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: t.landing.step2Title,
                desc: t.landing.step2Desc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: t.landing.step3Title,
                desc: t.landing.step3Desc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ),
              },
              {
                step: '04',
                title: t.landing.step4Title,
                desc: t.landing.step4Desc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-4xl font-black text-slate-100 group-hover:text-slate-200 transition-colors leading-none select-none">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Tracking + Calculator -- */}
      <section className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">{t.landing.tools}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t.landing.quickCheck}</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Tracking card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 md:p-9 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t.landing.trackTitle}</h3>
                  <p className="text-sm text-slate-500">{t.landing.trackDesc}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    placeholder={t.landing.trackPlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <Link
                  href={trackCode ? `/${locale}/track?code=${encodeURIComponent(trackCode)}` : `/${locale}/track`}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
                >
                  {t.landing.trackBtn}
                </Link>
              </div>
            </div>

            {/* Calculator card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 md:p-9 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.616 4.5 4.667V19.5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V4.667c0-1.052-.807-1.967-1.907-2.096A48.507 48.507 0 0012 2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t.landing.calcTitle}</h3>
                  <p className="text-sm text-slate-500">{t.landing.calcDesc}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-2.5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder={t.landing.calcPlaceholder}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
                <button
                  onClick={handleCalc}
                  disabled={calcLoading || !calcWeight}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
                >
                  {calcLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      ...
                    </span>
                  ) : t.landing.calcBtn}
                </button>
              </div>
              {calcResult && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">{t.landing.deliveryCost}</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">${calcResult.price}</p>
                  </div>
                  {calcResult.route && (
                    <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      {calcResult.route}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -- Features -- */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">{t.landing.whyUs}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t.landing.advantages}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: t.landing.tracking,
                desc: t.landing.trackingDesc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
                color: 'bg-blue-50 text-blue-600',
              },
              {
                title: t.landing.transparentPrices,
                desc: t.landing.transparentPricesDesc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                title: t.landing.telegramBot,
                desc: t.landing.telegramBotDesc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                ),
                color: 'bg-sky-50 text-sky-600',
              },
              {
                title: t.landing.consolidation,
                desc: t.landing.consolidationDesc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ),
                color: 'bg-violet-50 text-violet-600',
              },
              {
                title: t.landing.customs,
                desc: t.landing.customsDesc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                color: 'bg-amber-50 text-amber-600',
              },
              {
                title: t.landing.security,
                desc: t.landing.securityDesc,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
                color: 'bg-rose-50 text-rose-600',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-100 bg-white p-7 hover:border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${f.color} group-hover:scale-110 transition-transform duration-200`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-800/40 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {t.landing.ctaTitle}
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-md mx-auto">
            {t.landing.ctaDesc}
          </p>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/20"
          >
            {t.landing.ctaBtn}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-300">Cargo Consolidation System</span>
            </div>
            <nav className="flex items-center gap-1">
              {[
                { href: `/${locale}/track`, label: t.landing.track },
                { href: `/${locale}/login`, label: t.landing.entry },
                { href: `/${locale}/register`, label: t.landing.registration },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} {t.landing.copyright}
          </div>
        </div>
      </footer>

    </div>
  );
}
