import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  Eye,
  MessageSquare,
  Pencil,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { REVENUE_SERIES_BY_TIMEFRAME } from '../data/mockData';
import {
  Client,
  CurrencyCode,
  NavSection,
  Property,
  PropertyCategory,
  TimeframeKey,
  Transaction,
  TransactionStatus,
} from '../types/immo';
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateFr,
  formatNumber,
} from '../utils/format';
import { PropertyTypeChart, RevenueProfitChart } from './Charts';
import { PropertyImage } from './PropertyImage';
import { PropertyStatusText, TransactionStatusText } from './StatusText';

interface DashboardViewProps {
  properties: Property[];
  transactions: Transaction[];
  clients: Client[];
  currency: CurrencyCode;
  onSelectProperty: (property: Property) => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (property: Property) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onNavigate: (section: NavSection) => void;
}

export function DashboardView({
  properties,
  transactions,
  clients,
  currency,
  onSelectProperty,
  onEditProperty,
  onDeleteProperty,
  onEditTransaction,
  onDeleteTransaction,
  onNavigate,
}: DashboardViewProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('year');
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory | 'Tous'>('Tous');
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<TransactionStatus | 'Toutes'>('Toutes');

  const series = REVENUE_SERIES_BY_TIMEFRAME[timeframe];

  // Aggregate KPI metrics dynamically from active timeframe + real client/transaction additions
  const kpiStats = useMemo(() => {
    const baseRevenue = series.reduce((sum, p) => sum + p.revenue, 0);
    const baseProfit = series.reduce((sum, p) => sum + p.profit, 0);
    const baseSales = series.reduce((sum, p) => sum + p.salesCount, 0);

    const isEmptyAll =
      properties.length === 0 && transactions.length === 0 && clients.length === 0;

    // Baseline vs current transactions delta (reflects both additions & deletions)
    const activeTx = transactions.filter((t) => t.status !== 'Annulée');
    const signedTx = transactions.filter((t) => t.status === 'Signée');
    const baselineTxRev = 13_450_000;
    const baselineTxProfit = 675_800 * 1.4;
    const currentTxRev = activeTx.reduce((s, t) => s + t.amount, 0);
    const currentTxProfit = activeTx.reduce((s, t) => s + t.commission * 1.4, 0);

    const deltaRev = currentTxRev - baselineTxRev;
    const deltaProfit = currentTxProfit - baselineTxProfit;
    const deltaSales = signedTx.length - 4;

    const totalRevenue = isEmptyAll
      ? 0
      : Math.max(
          0,
          (timeframe === 'month' ? series[series.length - 1].revenue : baseRevenue) + deltaRev
        );
    const totalProfit = isEmptyAll
      ? 0
      : Math.max(
          0,
          (timeframe === 'month' ? series[series.length - 1].profit : baseProfit) + deltaProfit
        );
    const totalSales = isEmptyAll
      ? 0
      : Math.max(0, (timeframe === 'month' ? 21 : baseSales) + deltaSales);

    const activeClientsCount = clients.length === 0 ? 0 : 180 + clients.length;

    const deltas: Record<TimeframeKey, { rev: string; sales: string; clients: string; profit: string }> = {
      month: { rev: '+11,8 %', sales: '+9,5 %', clients: '+6,2 %', profit: '+13,4 %' },
      quarter: { rev: '+16,2 %', sales: '+14,0 %', clients: '+8,9 %', profit: '+17,1 %' },
      year: { rev: '+22,4 %', sales: '+18,5 %', clients: '+12,3 %', profit: '+24,0 %' },
    };

    return [
      {
        label: 'Chiffre d’affaires',
        value: formatCompactCurrency(totalRevenue, currency),
        subValue: formatCurrency(totalRevenue, currency),
        delta: deltas[timeframe].rev,
        context:
          timeframe === 'month'
            ? 'vs mois précédent'
            : timeframe === 'quarter'
              ? 'vs trimestre préc.'
              : 'vs exercice 2025',
      },
      {
        label: 'Ventes conclues',
        value: `${formatNumber(totalSales)} biens`,
        subValue: `${transactions.filter((t) => t.status === 'Sous compromis').length} sous compromis`,
        delta: deltas[timeframe].sales,
        context: 'taux de closing 31,8 %',
      },
      {
        label: 'Clients actifs',
        value: formatNumber(activeClientsCount),
        subValue: `${clients.filter((c) => c.status === 'En négociation').length} en négociation`,
        delta: deltas[timeframe].clients,
        context: 'acquéreurs qualifiés',
      },
      {
        label: 'Bénéfices nets',
        value: formatCompactCurrency(totalProfit, currency),
        subValue: formatCurrency(totalProfit, currency),
        delta: deltas[timeframe].profit,
        context: 'marge nette 13,0 %',
      },
    ];
  }, [series, transactions, clients, timeframe, currency]);

  // Popular properties filtered by selected category
  const popularProperties = useMemo(() => {
    const filtered =
      selectedCategory === 'Tous'
        ? properties
        : properties.filter((p) => p.category === selectedCategory);

    return [...filtered]
      .sort((a, b) => b.views + b.inquiries * 25 - (a.views + a.inquiries * 25))
      .slice(0, 4);
  }, [properties, selectedCategory]);

  // Recent transactions filtered by search, status, and category
  const filteredTransactions = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (selectedCategory !== 'Tous' && tx.category !== selectedCategory) return false;
        if (txStatusFilter !== 'Toutes' && tx.status !== txStatusFilter) return false;
        if (!q) return true;
        return (
          tx.propertyTitle.toLowerCase().includes(q) ||
          tx.clientName.toLowerCase().includes(q) ||
          tx.location.toLowerCase().includes(q) ||
          tx.reference.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [transactions, selectedCategory, txStatusFilter, txSearch]);

  return (
    <div className="space-y-7">
      {/* Workspace Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Vue d’ensemble commerciale
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Suivi du portefeuille villas, appartements, studios et terrains
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            {(['Tous', 'Villa', 'Appartement', 'Studio', 'Terrain'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#0B1F3A] text-white'
                    : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-50'
                }`}
              >
                {cat === 'Tous' ? 'Tous' : `${cat}s`}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            {(
              [
                { id: 'month', label: 'Ce mois' },
                { id: 'quarter', label: 'Trimestre' },
                { id: 'year', label: 'Année' },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  timeframe === tf.id
                    ? 'bg-[#C9A24D] text-[#0B1F3A] font-semibold'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <section aria-label="Indicateurs clés de performance" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiStats.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono-num font-semibold text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {kpi.delta}
              </span>
            </div>

            <div className="mt-3">
              <p className="font-mono-num text-2xl font-bold text-[#0B1F3A] tracking-tight">
                {kpi.value}
              </p>
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-mono-num truncate">{kpi.subValue}</span>
                <span className="shrink-0 text-slate-400">{kpi.context}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Charts Row */}
      <section aria-label="Analyses graphiques" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <RevenueProfitChart data={series} currency={currency} />
        </div>
        <div className="lg:col-span-5">
          <PropertyTypeChart
            properties={properties}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            currency={currency}
          />
        </div>
      </section>

      {/* Most Popular Properties */}
      <section aria-label="Biens les plus populaires" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A]">
              Biens les plus populaires
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sélection classée selon l’engagement acquéreur et les demandes de visite
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('properties')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7524] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Voir tout le catalogue</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {popularProperties.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-600">
              Aucun bien disponible dans cette typologie pour le moment.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('Tous')}
              className="mt-3 px-4 py-2 text-xs font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54]"
            >
              Afficher toutes les typologies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {popularProperties.map((prop) => (
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
                      <span>
                        {prop.category} · {formatNumber(prop.surface)} m²
                      </span>
                      <PropertyStatusText status={prop.status} />
                    </div>
                    <h3 className="font-display text-sm font-semibold text-[#0B1F3A] mt-1.5 line-clamp-1 group-hover:text-[#9A7524] transition-colors">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {prop.location}, {prop.city}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono-num text-sm font-bold text-[#0B1F3A]">
                      {formatCurrency(prop.price, currency)}
                    </span>
                    <div className="flex items-center gap-2.5 text-[11px] font-mono-num text-slate-500">
                      <span className="inline-flex items-center gap-1" title="Vues">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        {formatNumber(prop.views)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Demandes">
                        <MessageSquare className="h-3.5 w-3.5 text-[#C9A24D]" />
                        {prop.inquiries}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions Table */}
      <section aria-label="Dernières transactions" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
              Dernières transactions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi des actes signés, compromis en cours et dossiers d’acquisition
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Rechercher un bien, client..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D] w-52"
              />
            </div>

            <select
              aria-label="Filtrer par statut"
              value={txStatusFilter}
              onChange={(e) =>
                setTxStatusFilter(e.target.value as TransactionStatus | 'Toutes')
              }
              className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            >
              <option value="Toutes">Tous les statuts</option>
              <option value="Signée">Signée</option>
              <option value="Sous compromis">Sous compromis</option>
              <option value="En attente">En attente</option>
              <option value="Annulée">Annulée</option>
            </select>

            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7524] transition-colors whitespace-nowrap"
            >
              <span>Tout voir</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-6 whitespace-nowrap">Référence</th>
                <th className="py-3 px-4 whitespace-nowrap">Bien &amp; secteur</th>
                <th className="py-3 px-4 whitespace-nowrap">Typologie</th>
                <th className="py-3 px-4 whitespace-nowrap">Acquéreur</th>
                <th className="py-3 px-4 whitespace-nowrap">Agent</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Montant</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Statut</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Aucune transaction ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors h-11"
                  >
                    <td className="py-3 px-6 font-mono-num font-medium text-[#0B1F3A] whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#0B1F3A] whitespace-nowrap">
                        {tx.propertyTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.location}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {tx.clientName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {tx.agentName}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-slate-500 whitespace-nowrap">
                      {formatDateFr(tx.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A] whitespace-nowrap">
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <TransactionStatusText status={tx.status} />
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          title={`Modifier ${tx.reference}`}
                          aria-label={`Modifier la transaction ${tx.reference}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx)}
                          title={`Supprimer ${tx.reference}`}
                          aria-label={`Supprimer la transaction ${tx.reference}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
