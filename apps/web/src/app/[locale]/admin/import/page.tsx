'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function BulkImportPage() {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  useEffect(() => {
    apiFetch<any[]>('/admin/warehouses').then((w) => {
      const list = w.map((x: any) => ({ id: x.id, name: x.name }));
      setWarehouses(list);
      if (list.length > 0) setWarehouseId(list[0].id);
    }).catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim() || !warehouseId) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await apiFetch<{ imported: number; errors: string[] }>('/admin/import/parcels', {
        method: 'POST',
        body: JSON.stringify({ csv: csvText, warehouseId }),
      });
      setResult(res);
    } catch {
      setResult({ imported: 0, errors: ['Ошибка импорта'] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Массовый импорт посылок</h1>
      <p className="text-sm text-gray-500 mb-6">
        Загрузите CSV файл с колонками: <code className="bg-gray-100 px-1 rounded">tracking</code> (обязательно),{' '}
        <code className="bg-gray-100 px-1 rounded">client_code</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">marketplace</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">weight</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">category</code>
      </p>

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Склад</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">CSV файл</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {csvText && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Предпросмотр ({csvText.split('\n').length - 1} строк)</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              className="w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={importing || !csvText.trim() || !warehouseId}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {importing ? 'Импорт...' : 'Импортировать'}
        </button>

        {result && (
          <div className={`rounded-lg border p-4 ${result.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <p className="font-medium text-sm">
              Импортировано: <span className="text-green-700">{result.imported}</span>
              {result.errors.length > 0 && (
                <span className="text-amber-700 ml-3">Ошибок: {result.errors.length}</span>
              )}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i} className="text-xs text-red-600">{err}</li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-xs text-gray-500">...и ещё {result.errors.length - 20} ошибок</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
