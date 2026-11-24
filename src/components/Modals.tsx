import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  MapPin,
  Maximize2,
  MessageSquare,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { IMAGE_PATHS } from '../data/mockData';
import {
  Agent,
  Client,
  CurrencyCode,
  Property,
  PropertyCategory,
  PropertyStatus,
  Transaction,
  TransactionStatus,
} from '../types/immo';
import { formatCurrency, formatDateFr, formatNumber } from '../utils/format';
import { PropertyImage } from './PropertyImage';
import { PropertyStatusText } from './StatusText';

interface PropertyDetailModalProps {
  property: Property | null;
  agents: Agent[];
  currency: CurrencyCode;
  onClose: () => void;
  onUpdateStatus: (propertyId: string, newStatus: PropertyStatus) => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (property: Property) => void;
}

export function PropertyDetailModal({
  property,
  agents,
  currency,
  onClose,
  onUpdateStatus,
  onEditProperty,
  onDeleteProperty,
}: PropertyDetailModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (property) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [property, onClose]);

  if (!property) return null;

  const agent = agents.find((a) => a.id === property.agentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-60 sm:h-72 bg-slate-100">
          <PropertyImage
            src={property.imageUrl}
            alt={property.title}
            category={property.category}
            className="w-full h-full"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/95 text-[#0B1F3A] hover:bg-white shadow-sm transition-colors"
            aria-label="Fermer la fiche du bien"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono-num font-medium text-[#9A7524]">
                  {property.reference}
                </span>
                <span aria-hidden="true">·</span>
                <span>{property.category}</span>
                <span aria-hidden="true">·</span>
                <PropertyStatusText status={property.status} />
              </div>
              <h3
                id="property-modal-title"
                className="font-display text-xl font-bold text-[#0B1F3A]"
              >
                {property.title}
              </h3>
              <p className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
                <MapPin className="h-4 w-4 text-[#C9A24D] shrink-0" />
                <span>
                  {property.location}, {property.city}
                </span>
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-xs text-slate-500">Prix affiché</p>
              <p className="font-mono-num text-xl font-bold text-[#0B1F3A]">
                {formatCurrency(property.price, currency)}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Surface</p>
              <p className="font-mono-num text-sm font-semibold text-[#0B1F3A] mt-0.5 flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                {formatNumber(property.surface)} m²
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Configuration</p>
              <p className="font-mono-num text-sm font-semibold text-[#0B1F3A] mt-0.5">
                {property.rooms ? `${property.rooms} pièces` : 'Parcelle'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vues</p>
              <p className="font-mono-num text-sm font-semibold text-[#0B1F3A] mt-0.5 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                {formatNumber(property.views)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Demandes</p>
              <p className="font-mono-num text-sm font-semibold text-[#0B1F3A] mt-0.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                {property.inquiries}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Mandat géré par{' '}
              <span className="font-medium text-[#0B1F3A]">
                {agent ? agent.name : 'Équipe ImmoLuxe'}
              </span>{' '}
              · Ajouté le {formatDateFr(property.addedDate)}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <label htmlFor="modal-status-select" className="text-xs text-slate-500">
                  Statut :
                </label>
                <select
                  id="modal-status-select"
                  value={property.status}
                  onChange={(e) =>
                    onUpdateStatus(property.id, e.target.value as PropertyStatus)
                  }
                  className="text-xs font-medium text-[#0B1F3A] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Sous offre">Sous offre</option>
                  <option value="Vendu">Vendu</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProperty(property);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Modifier</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteProperty(property)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = 'Supprimer',
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="confirm-delete-title"
                className="font-display text-base font-semibold text-[#0B1F3A]"
              >
                {title}
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PropertyFormModalProps {
  open: boolean;
  initialData?: Property | null;
  agents: Agent[];
  onClose: () => void;
  onSave: (
    payload: Omit<Property, 'id' | 'reference' | 'views' | 'inquiries' | 'addedDate'>,
    existingId?: string
  ) => void;
}

export function PropertyFormModal({
  open,
  initialData,
  agents,
  onClose,
  onSave,
}: PropertyFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PropertyCategory>('Villa');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('5');
  const [status, setStatus] = useState<PropertyStatus>('Disponible');
  const [agentId, setAgentId] = useState(agents[0]?.id ?? '');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setLocation(initialData.location);
      setCity(initialData.city);
      setPrice(String(initialData.price));
      setSurface(String(initialData.surface));
      setRooms(initialData.rooms ? String(initialData.rooms) : '1');
      setStatus(initialData.status);
      setAgentId(initialData.agentId || agents[0]?.id || '');
      setDescription(initialData.description);
    } else {
      setTitle('');
      setCategory('Villa');
      setLocation('');
      setCity('');
      setPrice('');
      setSurface('');
      setRooms('5');
      setStatus('Disponible');
      setAgentId(agents[0]?.id ?? '');
      setDescription('');
    }
  }, [open, initialData, agents]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  const getDefaultImage = (cat: PropertyCategory) => {
    switch (cat) {
      case 'Villa':
        return IMAGE_PATHS.villa;
      case 'Appartement':
        return IMAGE_PATHS.appartement;
      case 'Studio':
        return IMAGE_PATHS.studio;
      case 'Terrain':
        return IMAGE_PATHS.terrain;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !city.trim() || !price || !surface) return;
    onSave(
      {
        title: title.trim(),
        category,
        location: location.trim() || city.trim(),
        city: city.trim(),
        price: Number(price),
        surface: Number(surface),
        rooms: category === 'Terrain' ? undefined : Number(rooms) || 1,
        status,
        imageUrl: initialData?.imageUrl ?? getDefaultImage(category),
        agentId,
        featured: initialData?.featured ?? true,
        description:
          description.trim() ||
          'Bien immobilier de prestige sélectionné par ImmoLuxe avec prestations haut de gamme.',
      },
      initialData?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 id="property-form-title" className="font-display text-base font-semibold text-[#0B1F3A]">
            {initialData ? `Modifier · ${initialData.reference}` : 'Ajouter un nouveau bien'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Intitulé du bien
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Villa Belvédère"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Typologie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="Villa">Villa</option>
                <option value="Appartement">Appartement</option>
                <option value="Studio">Studio</option>
                <option value="Terrain">Terrain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="Disponible">Disponible</option>
                <option value="Sous offre">Sous offre</option>
                <option value="Vendu">Vendu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ville</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex. Marrakech"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quartier</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex. Palmeraie"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prix (MAD)</label>
              <input
                type="number"
                required
                min={50000}
                step={5000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3450000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Surface (m²)
                </label>
                <input
                  type="number"
                  required
                  min={12}
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder="240"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                />
              </div>
              {category !== 'Terrain' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pièces</label>
                  <input
                    type="number"
                    min={1}
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Agent responsable
              </label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                {agents.length === 0 ? (
                  <option value="">Équipe ImmoLuxe</option>
                ) : (
                  agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Prestations, exposition, vue..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#132F54] rounded-lg transition-colors"
            >
              {initialData ? 'Enregistrer les modifications' : 'Enregistrer le bien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SaleFormModalProps {
  open: boolean;
  initialData?: Transaction | null;
  properties: Property[];
  agents: Agent[];
  commissionRate: number;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'reference'>, existingId?: string) => void;
}

export function SaleFormModal({
  open,
  initialData,
  properties,
  agents,
  commissionRate,
  onClose,
  onSave,
}: SaleFormModalProps) {
  const [propertyId, setPropertyId] = useState('');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [category, setCategory] = useState<PropertyCategory>('Villa');
  const [location, setLocation] = useState('');
  const [clientName, setClientName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('Sous compromis');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setPropertyId(initialData.propertyId);
      setPropertyTitle(initialData.propertyTitle);
      setCategory(initialData.category);
      setLocation(initialData.location);
      setClientName(initialData.clientName);
      setAgentName(initialData.agentName);
      setDate(initialData.date);
      setAmount(String(initialData.amount));
      setStatus(initialData.status);
    } else {
      const firstProp = properties[0];
      setPropertyId(firstProp?.id ?? '');
      setPropertyTitle(firstProp?.title ?? '');
      setCategory(firstProp?.category ?? 'Villa');
      setLocation(firstProp?.city ?? '');
      setClientName('');
      const matchedAgent = agents.find((a) => a.id === firstProp?.agentId);
      setAgentName(matchedAgent?.name ?? agents[0]?.name ?? 'Claire Beaumont');
      setDate(new Date().toISOString().slice(0, 10));
      setAmount(String(firstProp?.price ?? 1200000));
      setStatus('Sous compromis');
    }
  }, [open, initialData, properties, agents]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  const handlePropertyChange = (id: string) => {
    setPropertyId(id);
    const prop = properties.find((p) => p.id === id);
    if (prop) {
      setPropertyTitle(prop.title);
      setCategory(prop.category);
      setLocation(prop.city);
      setAmount(String(prop.price));
      const ag = agents.find((a) => a.id === prop.agentId);
      if (ag) setAgentName(ag.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProp = properties.find((p) => p.id === propertyId);
    const resolvedTitle = selectedProp?.title ?? propertyTitle.trim();
    if (!resolvedTitle || !clientName.trim() || !amount) return;

    const numericAmount = Number(amount);
    onSave(
      {
        propertyId: selectedProp?.id ?? propertyId,
        propertyTitle: resolvedTitle,
        category: selectedProp?.category ?? category,
        location: selectedProp?.city ?? (location.trim() || 'Casablanca'),
        clientName: clientName.trim(),
        agentName: agentName || 'Équipe ImmoLuxe',
        date: date || new Date().toISOString().slice(0, 10),
        amount: numericAmount,
        commission: Math.round((numericAmount * commissionRate) / 100),
        status,
      },
      initialData?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 id="sale-form-title" className="font-display text-base font-semibold text-[#0B1F3A]">
            {initialData ? `Modifier · ${initialData.reference}` : 'Enregistrer une transaction'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {properties.length > 0 ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bien concerné</label>
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category} · {p.city})
                  </option>
                ))}
                {initialData && !properties.some((p) => p.id === initialData.propertyId) && (
                  <option value={initialData.propertyId}>{initialData.propertyTitle}</option>
                )}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Intitulé du bien
              </label>
              <input
                type="text"
                required
                value={propertyTitle}
                onChange={(e) => setPropertyTitle(e.target.value)}
                placeholder="Ex. Villa Anfa"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom de l’acquéreur
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex. M. & Mme Bennani"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Montant (MAD)</label>
              <input
                type="number"
                required
                min={50000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="Signée">Signée</option>
                <option value="Sous compromis">Sous compromis</option>
                <option value="En attente">En attente</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Agent</label>
              <select
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                {agents.length === 0 ? (
                  <option value="Équipe ImmoLuxe">Équipe ImmoLuxe</option>
                ) : (
                  agents.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#132F54] rounded-lg transition-colors"
            >
              {initialData ? 'Enregistrer' : 'Valider la vente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClientFormModalProps {
  open: boolean;
  initialData?: Client | null;
  agents: Agent[];
  onClose: () => void;
  onSave: (client: Omit<Client, 'id' | 'lastContact'>, existingId?: string) => void;
}

export function ClientFormModal({
  open,
  initialData,
  agents,
  onClose,
  onSave,
}: ClientFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [preferredCategory, setPreferredCategory] = useState<PropertyCategory>('Villa');
  const [budgetMax, setBudgetMax] = useState('1500000');
  const [status, setStatus] = useState<Client['status']>('Actif');
  const [assignedAgent, setAssignedAgent] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setCity(initialData.city);
      setPreferredCategory(initialData.preferredCategory);
      setBudgetMax(String(initialData.budgetMax));
      setStatus(initialData.status);
      setAssignedAgent(initialData.assignedAgent);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCity('');
      setPreferredCategory('Villa');
      setBudgetMax('1500000');
      setStatus('Actif');
      setAssignedAgent(agents[0]?.name ?? 'Claire Beaumont');
    }
  }, [open, initialData, agents]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+212 6 00 00 00 00',
        city: city.trim() || 'Casablanca',
        preferredCategory,
        budgetMax: Number(budgetMax) || 1000000,
        status,
        assignedAgent: assignedAgent || 'Équipe ImmoLuxe',
      },
      initialData?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 id="client-form-title" className="font-display text-base font-semibold text-[#0B1F3A]">
            {initialData ? `Modifier · ${initialData.name}` : 'Ajouter un client'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom complet / Société
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Youssef & Nadia Tazi"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@exemple.ma"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 12 34 56 78"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Recherche</label>
              <select
                value={preferredCategory}
                onChange={(e) => setPreferredCategory(e.target.value as PropertyCategory)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="Villa">Villa</option>
                <option value="Appartement">Appartement</option>
                <option value="Studio">Studio</option>
                <option value="Terrain">Terrain</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Budget max (MAD)
              </label>
              <input
                type="number"
                required
                min={100000}
                step={50000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Secteur souhaité
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex. Casablanca Anfa"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Client['status'])}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="Actif">Actif</option>
                <option value="En négociation">En négociation</option>
                <option value="Acquéreur">Acquéreur</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Agent dédié</label>
            <select
              value={assignedAgent}
              onChange={(e) => setAssignedAgent(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            >
              {agents.length === 0 ? (
                <option value="Équipe ImmoLuxe">Équipe ImmoLuxe</option>
              ) : (
                agents.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#132F54] rounded-lg transition-colors"
            >
              {initialData ? 'Enregistrer' : 'Ajouter le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AgentFormModalProps {
  open: boolean;
  initialData?: Agent | null;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id' | 'initials'>, existingId?: string) => void;
}

export function AgentFormModal({
  open,
  initialData,
  onClose,
  onSave,
}: AgentFormModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [region, setRegion] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salesCount, setSalesCount] = useState('0');
  const [revenueGenerated, setRevenueGenerated] = useState('0');
  const [conversionRate, setConversionRate] = useState('28.0');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setRegion(initialData.region);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setSalesCount(String(initialData.salesCount));
      setRevenueGenerated(String(initialData.revenueGenerated));
      setConversionRate(String(initialData.conversionRate));
    } else {
      setName('');
      setRole('Conseiller Immobilier Prestige');
      setRegion('');
      setEmail('');
      setPhone('');
      setSalesCount('0');
      setRevenueGenerated('0');
      setConversionRate('25.0');
    }
  }, [open, initialData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave(
      {
        name: name.trim(),
        role: role.trim() || 'Conseiller Immobilier',
        region: region.trim() || 'Casablanca & Rabat',
        email: email.trim(),
        phone: phone.trim() || '+212 6 00 00 00 00',
        avatarUrl: initialData?.avatarUrl,
        salesCount: Number(salesCount) || 0,
        revenueGenerated: Number(revenueGenerated) || 0,
        activeListings: initialData?.activeListings ?? 0,
        conversionRate: Number(conversionRate) || 0,
      },
      initialData?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 id="agent-form-title" className="font-display text-base font-semibold text-[#0B1F3A]">
            {initialData ? `Modifier · ${initialData.name}` : 'Ajouter un conseiller'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nom complet</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Karim Benjelloun"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fonction</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Secteur</label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ex. Marrakech"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="k.benjelloun@immoluxe.ma"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 61 00 00 00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ventes</label>
              <input
                type="number"
                min={0}
                value={salesCount}
                onChange={(e) => setSalesCount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Volume (MAD)</label>
              <input
                type="number"
                min={0}
                step={50000}
                value={revenueGenerated}
                onChange={(e) => setRevenueGenerated(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Taux (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#132F54] rounded-lg transition-colors"
            >
              {initialData ? 'Enregistrer' : 'Ajouter le conseiller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
