'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface UnidentifiedParcel {
  id: string;
  phoneOnLabel: string;
  weight: number;
  description: string;
  createdAt: string;
}

export default function UnidentifiedParcelsPage() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<UnidentifiedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<UnidentifiedParcel[]>('/warehouse/parcels/unidentified');
      setParcels(data);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const handleAssign = async (parcelId: string) => {
    if (!customerId.trim()) return;
    setAssignLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/warehouse/parcels/${parcelId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ customerId: customerId.trim() }),
      });
      setSuccess('Посылка привязана к клиенту');
      setAssigningId(null);
      setCustomerId('');
      fetchParcels();
    } catch (err: any) {
      setError(err.message || 'Ошибка привязки');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Неопознанные посылки</h1>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Телефон на этикетке</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Вес</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Описание</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действие</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : parcels.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Неопознанных посылок нет
                </td>
              </tr>
            ) : (
              parcels.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{p.phoneOnLabel}</td>
                  <td className="px-4 py-3">{p.weight} кг</td>
                  <td className="px-4 py-3 max-w-xs truncate">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    {assigningId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customerId}
                          onChange={(e) => setCustomerId(e.target.value)}
                          placeholder="CD-XXXX"
                          className="w-28 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAssign(p.id)}
                          disabled={assignLoading || !customerId.trim()}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {assignLoading ? '...' : 'OK'}
                        </button>
                        <button
                          onClick={() => { setAssigningId(null); setCustomerId(''); }}
                          className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningId(p.id)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        Привязать
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
