import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/components/toast';
import { HtmlLang } from '@/components/html-lang';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'Cargo Consolidation — Доставка из Китая в Таджикистан',
  description: 'Надёжная консолидация и доставка грузов из Китая в Таджикистан. Отслеживание, прозрачные цены, Telegram-уведомления.',
  keywords: ['карго', 'доставка', 'Китай', 'Таджикистан', 'консолидация', 'посылки'],
  openGraph: {
    title: 'Cargo Consolidation',
    description: 'Доставка грузов из Китая в Таджикистан',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <PwaRegister />
        <I18nProvider>
          <HtmlLang />
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
