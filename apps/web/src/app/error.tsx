'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-7xl font-bold text-gray-200">500</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Что-то пошло не так</h2>
        <p className="mt-2 text-gray-500">Произошла непредвиденная ошибка. Попробуйте обновить страницу.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}
