import { useMemo, useState } from 'react';
import { Eye, Grid3X3, List, MessageSquare, Pencil, Search, Trash2 } from 'lucide-react';
import { Agent, CurrencyCode, Property, PropertyCategory, PropertyStatus } from '../types/immo';
import { formatCurrency, formatNumber } from '../utils/format';
import { PropertyImage } from './PropertyImage';
import { PropertyStatusText } from './StatusText';

interface PropertiesViewProps {
  properties: Property[];
  agents: Agent[];
  currency: CurrencyCode;
  onSelectProperty: (property: Property) => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (property: Property) => void;
  onOpenAddProperty: () => void;
}

export function PropertiesView({
  properties,
  agents,
  currency,
  onSelectProperty,
  onEditProperty,
  onDeleteProperty,
  onOpenAddProperty,
}: PropertiesViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PropertyCategory | 'Tous'>('Tous');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'Tous'>('Tous');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (categoryFilter !== 'Tous' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'Tous' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      );
    });
  }, [properties, search, categoryFilter, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: properties.length,
      available: properties.filter((p) => p.status === 'Disponible').length,
      offer: properties.filter((p) => p.status === 'Sous offre').length,
      sold: properties.filter((p) => p.status === 'Vendu').length,
    };
  }, [properties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Catalogue des biens immobiliers
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-mono-num">
            {counts.all} mandats · {counts.available} disponibles · {counts.offer} sous offre ·{' '}
            {counts.sold} vendus
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#0B1F3A] text-white'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>Grille</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-[#0B1F3A] text-white'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Liste</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['Tous', 'Villa', 'Appartement', 'Studio', 'Terrain'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              {cat === 'Tous' ? 'Tous les biens' : `${cat}s`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ville, référence, intitulé..."
              className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            />
          </div>

          <select
            aria-label="Filtrer par statut du bien"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PropertyStatus | 'Tous')}
            className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
          >
            <option value="Tous">Tous statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="Sous offre">Sous offre</option>
            <option value="Vendu">Vendu</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-semibold text-[#0B1F3A]">
            Aucun bien ne correspond à ces critères
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Modifiez vos filtres ou enregistrez un nouveau mandat dans le catalogue.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('Tous');
                setStatusFilter('Tous');
              }}
              className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
            <button
              type="button"
              onClick={onOpenAddProperty}
              className="px-4 py-2 text-xs font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54]"
            >
              Ajouter un bien
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((prop) => {
            const agent = agents.find((a) => a.id === prop.agentId);
            return (
              <div
                key={prop.id}
                onClick={() => onSelectProperty(prop)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectProperty(prop);
                  }
                }}
                className="group cursor-pointer text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#C9A24D] transition-colors flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <PropertyImage
                    src={prop.imageUrl}
                    alt={prop.title}
                    category={prop.category}
                    className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProperty(prop);
                      }}
                      title={`Modifier ${prop.title}`}
                      aria-label={`Modifier ${prop.title}`}
                      className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-[#0B1F3A] hover:bg-white shadow-xs transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProperty(prop);
                      }}
                      title={`Supprimer ${prop.title}`}
                      aria-label={`Supprimer ${prop.title}`}
                      className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-red-600 hover:bg-white shadow-xs transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between w-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono-num text-[#9A7524] font-medium">
                        {prop.reference}
                      </span>
                      <PropertyStatusText status={prop.status} />
                    </div>
                    <h3 className="font-display text-sm font-semibold text-[#0B1F3A] mt-1.5 line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {prop.category} · {formatNumber(prop.surface)} m² · {prop.city}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono-num text-sm font-bold text-[#0B1F3A]">
                      {formatCurrency(prop.price, currency)}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                      {agent?.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-6 whitespace-nowrap">Réf.</th>
                  <th className="py-3 px-4 whitespace-nowrap">Bien</th>
                  <th className="py-3 px-4 whitespace-nowrap">Typologie</th>
                  <th className="py-3 px-4 whitespace-nowrap">Localisation</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Surface</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Intérêt</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Prix</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Statut</th>
                  <th className="py-3 px-6 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((prop) => (
                  <tr
                    key={prop.id}
                    onClick={() => onSelectProperty(prop)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors h-11"
                  >
                    <td className="py-3 px-6 font-mono-num font-medium text-[#9A7524] whitespace-nowrap">
                      {prop.reference}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0B1F3A] whitespace-nowrap">
                      {prop.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{prop.category}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {prop.location}, {prop.city}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-700 whitespace-nowrap">
                      {formatNumber(prop.surface)} m²
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {formatNumber(prop.views)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-[#C9A24D]" />
                          {prop.inquiries}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A] whitespace-nowrap">
                      {formatCurrency(prop.price, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <PropertyStatusText status={prop.status} />
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProperty(prop);
                          }}
                          title={`Modifier ${prop.title}`}
                          aria-label={`Modifier ${prop.title}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProperty(prop);
                          }}
                          title={`Supprimer ${prop.title}`}
                          aria-label={`Supprimer ${prop.title}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
