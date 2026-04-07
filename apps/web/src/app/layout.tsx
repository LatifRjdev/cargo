import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n-context';
import { ToastProvider } from '@/components/toast';
import { HtmlLang } from '@/components/html-lang';

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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <I18nProvider>
          <HtmlLang />
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
