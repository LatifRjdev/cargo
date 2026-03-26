import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-7xl font-bold text-gray-200">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Страница не найдена</h2>
        <p className="mt-2 text-gray-500">Запрашиваемая страница не существует или была удалена.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            На главную
          </Link>
          <Link
            href="/ru/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            В кабинет
          </Link>
        </div>
      </div>
    </div>
  );
}
