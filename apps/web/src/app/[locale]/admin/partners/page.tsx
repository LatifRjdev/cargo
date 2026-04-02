'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Partner {
  id: string;
  name: string;
  code: string;
  integration: 'MANUAL' | 'WEBHOOK' | 'API';
  isActive: boolean;
  apiKey: string | null;
  trackingUrlTemplate: string | null;
  apiBaseUrl: string | null;
  webhookUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactPerson: string | null;
  notes: string | null;
  createdAt: string;
  _count?: { shipments: number };
}

interface PartnerDetail extends Partner {
  shipments: PartnerShipment[];
  statusMappings: StatusMapping[];
}

interface StatusMapping {
  id: string;
  partnerStatus: string;
  mappedStatus: string;
}

interface PartnerShipment {
  id: string;
  partnerTrackingCode: string;
  status: string;
  location: string | null;
  estimatedDelivery: string | null;
  notes: string | null;
  createdAt: string;
  box?: { boxCode: string } | null;
  customer?: { fullName: string | null; clientCode: string | null } | null;
}

const INTEGRATION_BADGE: Record<string, { bg: string; label: string }> = {
  MANUAL: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Ручной' },
  WEBHOOK: { bg: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Webhook' },
  API: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'API' },
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Создана',
  PICKED_UP: 'Забрана',
  IN_TRANSIT: 'В пути',
  CUSTOMS: 'Таможня',
  ARRIVED: 'Прибыла',
  DELIVERED: 'Доставлена',
  CANCELLED: 'Отменена',
};

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-600 border-slate-200',
  PICKED_UP: 'bg-purple-50 text-purple-700 border-purple-200',
  IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-200',
  CUSTOMS: 'bg-orange-50 text-orange-700 border-orange-200',
  ARRIVED: 'bg-teal-50 text-teal-700 border-teal-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const SHIPMENT_STATUSES = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'DELIVERED', 'CANCELLED'];

export default function AdminPartnersPage() {
  const { t, locale } = useI18n();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<PartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create partner modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIntegration, setFormIntegration] = useState<'MANUAL' | 'WEBHOOK' | 'API'>('MANUAL');
  const [formTrackingUrl, setFormTrackingUrl] = useState('');
  const [formApiBaseUrl, setFormApiBaseUrl] = useState('');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Status mapping form
  const [mappingPartnerStatus, setMappingPartnerStatus] = useState('');
  const [mappingMappedStatus, setMappingMappedStatus] = useState('CREATED');
  const [mappingSaving, setMappingSaving] = useState(false);

  // Create shipment modal
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState('');
  const [shipFormTrackingCode, setShipFormTrackingCode] = useState('');
  const [shipFormBoxId, setShipFormBoxId] = useState('');
  const [shipFormCustomerId, setShipFormCustomerId] = useState('');
  const [shipFormEstimatedDelivery, setShipFormEstimatedDelivery] = useState('');
  const [shipFormNotes, setShipFormNotes] = useState('');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Partner[]>('/admin/partners');
      setPartners(data);
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await apiFetch<PartnerDetail>(`/admin/partners/${id}`);
      setExpandedDetail(data);
    } catch {
      setExpandedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
  };

  const resetCreateForm = () => {
    setFormName(''); setFormCode(''); setFormIntegration('MANUAL');
    setFormTrackingUrl(''); setFormApiBaseUrl(''); setFormWebhookUrl('');
    setFormContactPhone(''); setFormContactEmail(''); setFormContactPerson('');
    setFormNotes(''); setCreateError('');
  };

  const handleCreatePartner = async () => {
    if (!formName || !formCode) { setCreateError('Название и код обязательны'); return; }
    setCreateLoading(true);
    setCreateError('');
    try {
      const body: Record<string, unknown> = {
        name: formName,
        code: formCode,
        integration: formIntegration,
      };
      if (formTrackingUrl) body.trackingUrlTemplate = formTrackingUrl;
      if (formApiBaseUrl) body.apiBaseUrl = formApiBaseUrl;
      if (formWebhookUrl) body.webhookUrl = formWebhookUrl;
      if (formContactPhone) body.contactPhone = formContactPhone;
      if (formContactEmail) body.contactEmail = formContactEmail;
      if (formContactPerson) body.contactPerson = formContactPerson;
      if (formNotes) body.notes = formNotes;

      await apiFetch('/admin/partners', { method: 'POST', body: JSON.stringify(body) });
      setShowCreateModal(false);
      resetCreateForm();
      fetchPartners();
    } catch (err: any) {
      setCreateError(err.message || 'Ошибка создания');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRegenerateKey = async (partnerId: string) => {
    if (!confirm('Пересоздать API ключ? Старый ключ перестанет работать.')) return;
    try {
      await apiFetch(`/admin/partners/${partnerId}/regenerate-key`, { method: 'POST' });
      fetchDetail(partnerId);
      fetchPartners();
    } catch {
      alert('Ошибка пересоздания ключа');
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      await apiFetch(`/admin/partners/${partner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !partner.isActive }),
      });
      fetchPartners();
      if (expandedId === partner.id) fetchDetail(partner.id);
    } catch {
      alert('Ошибка обновления');
    }
  };

  const handleAddMapping = async (partnerId: string) => {
    if (!mappingPartnerStatus) return;
    setMappingSaving(true);
    try {
      await apiFetch(`/admin/partners/${partnerId}/mappings`, {
        method: 'POST',
        body: JSON.stringify({ partnerStatus: mappingPartnerStatus, mappedStatus: mappingMappedStatus }),
      });
      setMappingPartnerStatus('');
      setMappingMappedStatus('CREATED');
      fetchDetail(partnerId);
    } catch {
      alert('Ошибка добавления маппинга');
    } finally {
      setMappingSaving(false);
    }
  };

  const handleDeleteMapping = async (mappingId: string, partnerId: string) => {
    try {
      await apiFetch(`/admin/partners/mappings/${mappingId}`, { method: 'DELETE' });
      fetchDetail(partnerId);
    } catch {
      alert('Ошибка удаления');
    }
  };

  const handleCreateShipment = async (partnerId: string) => {
    if (!shipFormTrackingCode) { setShipmentError('Трекинг-код обязателен'); return; }
    setShipmentLoading(true);
    setShipmentError('');
    try {
      const body: Record<string, unknown> = {
        partnerId,
        partnerTrackingCode: shipFormTrackingCode,
      };
      if (shipFormBoxId) body.boxId = shipFormBoxId;
      if (shipFormCustomerId) body.customerId = shipFormCustomerId;
      if (shipFormEstimatedDelivery) body.estimatedDelivery = shipFormEstimatedDelivery;
      if (shipFormNotes) body.notes = shipFormNotes;

      await apiFetch('/admin/partner-shipments', { method: 'POST', body: JSON.stringify(body) });
      setShowShipmentModal(false);
      setShipFormTrackingCode(''); setShipFormBoxId(''); setShipFormCustomerId('');
      setShipFormEstimatedDelivery(''); setShipFormNotes(''); setShipmentError('');
      fetchDetail(partnerId);
    } catch (err: any) {
      setShipmentError(err.message || 'Ошибка создания отправки');
    } finally {
      setShipmentLoading(false);
    }
  };

  const handlePollAll = async () => {
    try {
      await apiFetch('/admin/partner-shipments/poll-all', { method: 'POST' });
      if (expandedId) fetchDetail(expandedId);
      fetchPartners();
    } catch {
      alert('Ошибка опроса');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Stats
  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.isActive).length;
  const webhookPartners = partners.filter(p => p.integration === 'WEBHOOK').length;
  const apiPartners = partners.filter(p => p.integration === 'API').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.02a4.5 4.5 0 00-6.364-6.364L4.5 8.88a4.5 4.5 0 001.242 7.244" />
              </svg>
            </span>
            Партнёры
          </h1>
          <p className="mt-1 text-sm text-slate-500 ml-[52px]">Управление партнёрскими компаниями и интеграциями</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePollAll} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
            Опросить всех
          </button>
          <button onClick={() => { resetCreateForm(); setShowCreateModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200/50 hover:from-violet-700 hover:to-purple-700 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Добавить партнёра
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Всего партнёров', value: totalPartners, color: 'blue', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
          { label: 'Активных', value: activePartners, color: 'green', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Webhook', value: webhookPartners, color: 'sky', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
          { label: 'API', value: apiPartners, color: 'emerald', icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5' },
        ].map((s) => {
          const bg = `bg-${s.color}-50`;
          const ic = `text-${s.color}-600`;
          const border = `border-t-${s.color}-500`;
          return (
            <div key={s.label} className={`bg-white rounded-2xl border border-slate-200/80 border-t-[3px] ${border} p-4 shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <svg className={`w-4 h-4 ${ic}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Partner Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 shadow-sm flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          </div>
        ) : partners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 shadow-sm text-center text-sm text-slate-400">
            Партнёры не найдены
          </div>
        ) : partners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Partner Header Row */}
            <div
              className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => toggleExpand(partner.id)}
            >
              <svg className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${expandedId === partner.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{partner.name}</h3>
                  <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{partner.code}</span>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${INTEGRATION_BADGE[partner.integration]?.bg || ''}`}>
                    {INTEGRATION_BADGE[partner.integration]?.label || partner.integration}
                  </span>
                  {!partner.isActive && (
                    <span className="inline-flex items-center rounded-md bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 text-[11px] font-medium">Неактивен</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  {partner.contactPerson && <span>{partner.contactPerson}</span>}
                  {partner.contactPhone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                      {partner.contactPhone}
                    </span>
                  )}
                  {partner.contactEmail && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                      {partner.contactEmail}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{partner._count?.shipments ?? 0}</p>
                  <p className="text-[11px] text-slate-400">отправок</p>
                </div>
                <div className="text-xs text-slate-400">{new Date(partner.createdAt).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedId === partner.id && (
              <div className="border-t border-slate-100 bg-slate-50/30">
                {detailLoading ? (
                  <div className="p-8 flex justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                  </div>
                ) : expandedDetail ? (
                  <div className="p-5 space-y-6">
                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(partner); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${partner.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {partner.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRegenerateKey(partner.id); }}
                        className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-all"
                      >
                        Пересоздать API ключ
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShipFormTrackingCode(''); setShipFormBoxId(''); setShipFormCustomerId('');
                          setShipFormEstimatedDelivery(''); setShipFormNotes(''); setShipmentError('');
                          setShowShipmentModal(true);
                        }}
                        className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-all"
                      >
                        Создать отправку
                      </button>
                    </div>

                    {/* API Key */}
                    {expandedDetail.apiKey && (
                      <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">API ключ</h4>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 text-xs font-mono bg-slate-50 rounded-lg px-3 py-2 text-slate-600 break-all select-all">
                            {expandedDetail.apiKey}
                          </code>
                          <button
                            onClick={() => copyToClipboard(expandedDetail.apiKey!)}
                            className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            {copiedKey ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                Скопировано
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                                Копировать
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Partner Details Grid */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Настройки интеграции</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {expandedDetail.trackingUrlTemplate && (
                          <div><span className="text-slate-400">Шаблон трекинга:</span> <span className="font-mono text-xs text-slate-600">{expandedDetail.trackingUrlTemplate}</span></div>
                        )}
                        {expandedDetail.apiBaseUrl && (
                          <div><span className="text-slate-400">API URL:</span> <span className="font-mono text-xs text-slate-600">{expandedDetail.apiBaseUrl}</span></div>
                        )}
                        {expandedDetail.webhookUrl && (
                          <div><span className="text-slate-400">Webhook URL:</span> <span className="font-mono text-xs text-slate-600">{expandedDetail.webhookUrl}</span></div>
                        )}
                        {expandedDetail.notes && (
                          <div className="sm:col-span-2"><span className="text-slate-400">Заметки:</span> <span className="text-slate-600 italic">{expandedDetail.notes}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Status Mappings */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Маппинг статусов</h4>
                      {expandedDetail.statusMappings.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {expandedDetail.statusMappings.map((m) => (
                            <div key={m.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                              <span className="text-xs font-mono font-medium text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{m.partnerStatus}</span>
                              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${SHIPMENT_STATUS_COLORS[m.mappedStatus] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {SHIPMENT_STATUS_LABELS[m.mappedStatus] || m.mappedStatus}
                              </span>
                              <button
                                onClick={() => handleDeleteMapping(m.id, partner.id)}
                                className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mb-4">Маппинги не настроены</p>
                      )}

                      {/* Add mapping form */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder="Статус партнёра"
                          value={mappingPartnerStatus}
                          onChange={(e) => setMappingPartnerStatus(e.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 w-40"
                        />
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        <select
                          value={mappingMappedStatus}
                          onChange={(e) => setMappingMappedStatus(e.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                        >
                          {SHIPMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{SHIPMENT_STATUS_LABELS[s] || s}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddMapping(partner.id)}
                          disabled={mappingSaving || !mappingPartnerStatus}
                          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-all"
                        >
                          {mappingSaving ? '...' : 'Добавить'}
                        </button>
                      </div>
                    </div>

                    {/* Recent Shipments */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Последние отправки</h4>
                      {expandedDetail.shipments.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Трекинг</th>
                                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Статус</th>
                                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Коробка</th>
                                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Клиент</th>
                                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Локация</th>
                                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Дата</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {expandedDetail.shipments.map((ship) => (
                                <tr key={ship.id} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2.5 font-mono text-xs font-bold text-slate-800">{ship.partnerTrackingCode}</td>
                                  <td className="px-3 py-2.5">
                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${SHIPMENT_STATUS_COLORS[ship.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                      {SHIPMENT_STATUS_LABELS[ship.status] || ship.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-600">{ship.box?.boxCode || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-slate-600">{ship.customer?.fullName || ship.customer?.clientCode || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-slate-500">{ship.location || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-slate-400">{new Date(ship.createdAt).toLocaleDateString('ru-RU')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Нет отправок</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-slate-400">Ошибка загрузки деталей</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Добавить партнёра</h2>
                <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {createError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{createError}</div>
              )}

              {/* Name & Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Название *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="DHL Express"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Код *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="DHL"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                  />
                </div>
              </div>

              {/* Integration Type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Тип интеграции</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'MANUAL' as const, label: 'Ручной', desc: 'Ручное обновление статусов', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', color: 'slate' },
                    { value: 'WEBHOOK' as const, label: 'Webhook', desc: 'Партнёр отправляет обновления', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5', color: 'blue' },
                    { value: 'API' as const, label: 'API', desc: 'Мы опрашиваем API партнёра', icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5', color: 'emerald' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormIntegration(opt.value)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        formIntegration === opt.value
                          ? `border-${opt.color === 'slate' ? 'slate-400' : opt.color + '-500'} bg-${opt.color}-50 ring-2 ring-${opt.color === 'slate' ? 'slate-400' : opt.color + '-500'}/20`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <svg className={`w-5 h-5 mb-1.5 ${formIntegration === opt.value ? `text-${opt.color === 'slate' ? 'slate-600' : opt.color + '-600'}` : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                      </svg>
                      <p className="text-xs font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Integration URLs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Шаблон URL трекинга</label>
                  <input
                    type="text"
                    value={formTrackingUrl}
                    onChange={(e) => setFormTrackingUrl(e.target.value)}
                    placeholder="https://tracking.partner.com/track/{code}"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                  />
                </div>
                {formIntegration === 'API' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">API Base URL</label>
                    <input
                      type="text"
                      value={formApiBaseUrl}
                      onChange={(e) => setFormApiBaseUrl(e.target.value)}
                      placeholder="https://api.partner.com/v1"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                    />
                  </div>
                )}
                {formIntegration === 'WEBHOOK' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Webhook URL</label>
                    <input
                      type="text"
                      value={formWebhookUrl}
                      onChange={(e) => setFormWebhookUrl(e.target.value)}
                      placeholder="https://our-api.com/webhooks/partner"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                    />
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Контактная информация</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="Контактное лицо"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="Телефон"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                    />
                    <input
                      type="email"
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Заметки</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Дополнительная информация..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                {t.common.cancel}
              </button>
              <button
                onClick={handleCreatePartner}
                disabled={createLoading || !formName || !formCode}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200/50 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {createLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Создание...
                  </span>
                ) : 'Создать партнёра'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shipment Modal */}
      {showShipmentModal && expandedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShipmentModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Создать отправку</h2>
                <button onClick={() => setShowShipmentModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {shipmentError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{shipmentError}</div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Трекинг-код партнёра *</label>
                <input
                  type="text"
                  value={shipFormTrackingCode}
                  onChange={(e) => setShipFormTrackingCode(e.target.value)}
                  placeholder="TRACK-123456"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">ID коробки</label>
                  <input
                    type="text"
                    value={shipFormBoxId}
                    onChange={(e) => setShipFormBoxId(e.target.value)}
                    placeholder="ID коробки"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">ID клиента</label>
                  <input
                    type="text"
                    value={shipFormCustomerId}
                    onChange={(e) => setShipFormCustomerId(e.target.value)}
                    placeholder="ID клиента"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Ожидаемая доставка</label>
                <input
                  type="date"
                  value={shipFormEstimatedDelivery}
                  onChange={(e) => setShipFormEstimatedDelivery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Заметки</label>
                <textarea
                  value={shipFormNotes}
                  onChange={(e) => setShipFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Дополнительная информация..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowShipmentModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleCreateShipment(expandedId)}
                disabled={shipmentLoading || !shipFormTrackingCode}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200/50 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {shipmentLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Создание...
                  </span>
                ) : 'Создать отправку'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
