'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSwitcher } from '@/components/language-switcher';

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'none' | 'notifications' | 'profile' | 'search'>('none');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notiLoading, setNotiLoading] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    if (openDropdown === 'none') return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) setOpenDropdown('none');
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openDropdown]);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('header-search') as HTMLInputElement;
        input?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      setSearchResults(await apiFetch<any>(`/admin/search?q=${encodeURIComponent(q.trim())}`));
      setOpenDropdown('search');
    } catch { setSearchResults(null); }
    finally { setSearching(false); }
  };

  const loadNotifications = async () => {
    setNotiLoading(true);
    try {
      const res = await apiFetch<any>('/admin/audit-log?limit=5');
      setNotifications(res.items || []);
    } catch { setNotifications([]); }
    finally { setNotiLoading(false); }
  };

  const navGroups = [
    {
      label: t.nav.main,
      items: [
        { href: `/${locale}/admin`, label: t.nav.dashboard, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { href: `/${locale}/admin/users`, label: t.nav.users, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { href: `/${locale}/admin/organizations`, label: t.nav.organizations, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      ],
    },
    {
      label: t.nav.warehouse,
      items: [
        { href: `/${locale}/admin/warehouses`, label: t.nav.warehouses, icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
        { href: `/${locale}/admin/boxes`, label: t.nav.boxes, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { href: `/${locale}/admin/import`, label: t.nav.import, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
        { href: `/${locale}/admin/prohibited-items`, label: t.nav.prohibited, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
      ],
    },
    {
      label: t.nav.finance,
      items: [
        { href: `/${locale}/admin/tariffs`, label: t.nav.tariffs, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
        { href: `/${locale}/admin/exchange-rates`, label: t.nav.exchangeRates, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { href: `/${locale}/admin/expenses`, label: t.nav.expenses, icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z' },
        { href: `/${locale}/admin/profit`, label: t.nav.profit, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
      ],
    },
    {
      label: t.nav.analytics,
      items: [
        { href: `/${locale}/admin/reports`, label: t.nav.reports, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { href: `/${locale}/admin/audit`, label: t.nav.audit, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      ],
    },
    {
      label: t.nav.settingsGroup,
      items: [
        { href: `/${locale}/admin/broadcast`, label: t.nav.broadcast, icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
        { href: `/${locale}/admin/settings`, label: t.nav.settings, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      ],
    },
  ];

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = (user.fullName || user.phone || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-[260px] transform bg-[#1e2a3a] transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg">C</div>
            <div>
              <p className="text-[15px] font-bold text-white">Cargo</p>
              <p className="text-[11px] text-slate-400">{t.admin.systemName}</p>
            </div>
            <button className="lg:hidden ml-auto text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                          active
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <NavIcon d={item.icon} />
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User info at bottom */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold ring-2 ring-blue-400/30">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.fullName || user.phone}</p>
                <p className="text-[11px] text-slate-400">{t.admin.administrator}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-[50] bg-white border-b border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button className="lg:hidden -ml-1 p-2 rounded-xl text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              {/* Search */}
              <div className="hidden md:block relative" data-dropdown>
                <form className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 w-72 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all" onSubmit={(e) => { e.preventDefault(); doSearch(headerSearch); }}>
                  <svg className="w-4 h-4 text-slate-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input id="header-search" type="text" value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} placeholder={t.admin.searchPlaceholder} className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none flex-1" />
                  {searching ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /> : <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400"><span className="text-xs">⌘</span>K</kbd>}
                </form>
                {openDropdown === 'search' && searchResults && (
                  <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-80 overflow-y-auto">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Результаты</span>
                      <button onClick={() => { setOpenDropdown('none'); setSearchResults(null); setHeaderSearch(''); }} className="text-xs text-slate-400 hover:text-slate-600">{t.common.close}</button>
                    </div>
                    {searchResults.clients?.map((c: any) => (
                      <a key={c.id} href={`/${locale}/admin/users/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{(c.fullName || '?')[0]}</div>
                        <div><p className="text-sm font-medium text-slate-700">{c.fullName || c.phone}</p><p className="text-[11px] text-slate-400">{c.clientCode}</p></div>
                      </a>
                    ))}
                    {searchResults.parcels?.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                        <p className="text-sm font-mono text-slate-700">{p.trackingNumber}</p>
                      </div>
                    ))}
                    {searchResults.boxes?.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg></div>
                        <p className="text-sm font-mono text-slate-700">{b.boxCode}</p>
                      </div>
                    ))}
                    {!searchResults.clients?.length && !searchResults.parcels?.length && !searchResults.boxes?.length && (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">{t.common.notFound}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              {/* Notifications */}
              <div className="relative" data-dropdown>
                <button onClick={async () => {
                  if (openDropdown === 'notifications') { setOpenDropdown('none'); return; }
                  setOpenDropdown('notifications');
                  await loadNotifications();
                }} className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                {openDropdown === 'notifications' && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Последние действия</p>
                      <button onClick={() => setOpenDropdown('none')} className="text-xs text-slate-400 hover:text-slate-600">{t.common.close}</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notiLoading ? (
                        <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">Нет действий</div>
                      ) : notifications.map((n: any) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => { setOpenDropdown('none'); router.push(`/${locale}/admin/audit`); }}>
                          <p className="text-sm text-slate-700 font-medium">{n.action}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.entityType} · {n.user?.fullName || 'Система'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString(locale === 'tg' ? 'tg-TJ' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                    <a href={`/${locale}/admin/audit`} onClick={() => setOpenDropdown('none')} className="block px-4 py-2.5 border-t border-slate-100 text-xs text-blue-600 font-medium hover:text-blue-700 hover:bg-slate-50 text-center">{t.nav.audit} →</a>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-slate-200" />

              {/* Profile */}
              <div className="relative" data-dropdown>
                <button onClick={() => setOpenDropdown(openDropdown === 'profile' ? 'none' : 'profile')} className="flex items-center gap-3 rounded-xl hover:bg-slate-50 px-2 py-1.5 transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shrink-0">{initials}</div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{user.fullName || user.phone}</p>
                    <p className="text-[11px] text-slate-400">{t.admin.administrator}</p>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 hidden md:block transition-transform ${openDropdown === 'profile' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openDropdown === 'profile' && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user.fullName || user.phone}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user.phone}</p>
                    </div>
                    <div className="py-1.5">
                      <a href={`/${locale}/admin/settings`} onClick={() => setOpenDropdown('none')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {t.nav.settings}
                      </a>
                      <a href={`/${locale}/admin/audit`} onClick={() => setOpenDropdown('none')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        {t.nav.audit}
                      </a>
                    </div>
                    <div className="border-t border-slate-100 py-1.5">
                      <button onClick={() => { setOpenDropdown('none'); logout(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {t.auth.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
