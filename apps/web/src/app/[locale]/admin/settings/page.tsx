'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

const settingLabels: Record<string, string> = {
  default_currency: 'Валюта по умолчанию',
  long_storage_days: 'Дней до долгого хранения',
  max_box_weight: 'Макс. вес коробки (кг)',
  company_name: 'Название компании',
  company_phone: 'Телефон компании',
  bot_welcome_message: 'Приветственное сообщение бота',
  warehouse_address_china: 'Адрес склада (Китай)',
  warehouse_address_dushanbe: 'Адрес склада (Душанбе)',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Setting[]>('/admin/settings');
      setSettings(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const startEdit = (setting: Setting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: editingKey, value: editValue }),
      });
      cancelEdit();
      fetchSettings();
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: newKey.trim(), value: newValue.trim() }),
      });
      setShowAddModal(false);
      setNewKey('');
      setNewValue('');
      fetchSettings();
    } catch {
      alert('Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Добавить параметр
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><p className="text-gray-500">Загрузка...</p></div>
      ) : settings.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">Настройки не найдены. Добавьте первый параметр.</div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {settings.map((s) => (
            <div key={s.key} className="px-5 py-4">
              {editingKey === s.key ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{settingLabels[s.key] || s.key}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.key}</p>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{settingLabels[s.key] || s.key}</p>
                    <p className="text-xs text-gray-400 font-mono mb-1">{s.key}</p>
                    <p className="text-sm text-gray-600">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Обновлено: {new Date(s.updatedAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(s)}
                    className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    Изменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 mx-4">
            <h2 className="text-lg font-bold mb-4">Новый параметр</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ключ</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="my_setting_key"
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Значение</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setNewKey(''); setNewValue(''); }}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newKey.trim() || !newValue.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
