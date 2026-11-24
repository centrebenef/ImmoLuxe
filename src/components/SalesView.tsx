import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { CurrencyCode, PropertyCategory, Transaction, TransactionStatus } from '../types/immo';
import { formatCompactCurrency, formatCurrency, formatDateFr } from '../utils/format';
import { TransactionStatusText } from './StatusText';

interface SalesViewProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onUpdateStatus: (id: string, status: TransactionStatus) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onOpenAddSale: () => void;
}

export function SalesView({
  transactions,
  currency,
  onUpdateStatus,
  onEditTransaction,
  onDeleteTransaction,
  onOpenAddSale,
}: SalesViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PropertyCategory | 'Tous'>('Tous');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'Toutes'>('Toutes');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (categoryFilter !== 'Tous' && t.category !== categoryFilter) return false;
      if (statusFilter !== 'Toutes' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.reference.toLowerCase().includes(q) ||
        t.propertyTitle.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.agentName.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, categoryFilter, statusFilter]);

  const summary = useMemo(() => {
    const signed = transactions.filter((t) => t.status === 'Signée');
    const underOffer = transactions.filter((t) => t.status === 'Sous compromis');
    const totalSignedVolume = signed.reduce((s, t) => s + t.amount, 0);
    const totalCommissions = signed.reduce((s, t) => s + t.commission, 0);
    return {
      signedCount: signed.length,
      underOfferCount: underOffer.length,
      totalSignedVolume,
      totalCommissions,
    };
  }, [transactions]);

  const handleExportCsv = () => {
    const header = [
      'Référence',
      'Bien',
      'Typologie',
      'Localisation',
      'Client',
      'Agent',
      'Date',
      'Montant',
      'Honoraires',
      'Statut',
    ];
    const rows = filtered.map((t) => [
      t.reference,
      `"${t.propertyTitle}"`,
      t.category,
      `"${t.location}"`,
      `"${t.clientName}"`,
      `"${t.agentName}"`,
      t.date,
      t.amount,
      t.commission,
      t.status,
    ]);
    const csv = [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'immoluxe_ventes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Suivi des ventes &amp; transactions
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Registre complet des actes signés, compromis et honoraires d’agence
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-[#0B1F3A] hover:bg-slate-50 transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5 text-[#C9A24D]" />
          <span>Télécharger CSV</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Volume acté (signé)</p>
          <p className="font-mono-num text-xl font-bold text-[#0B1F3A] mt-1">
            {formatCompactCurrency(summary.totalSignedVolume, currency)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Honoraires encaissés</p>
          <p className="font-mono-num text-xl font-bold text-[#9A7524] mt-1">
            {formatCurrency(summary.totalCommissions, currency)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Actes signés</p>
          <p className="font-mono-num text-xl font-bold text-[#0B1F3A] mt-1">
            {summary.signedCount} dossiers
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Compromis en cours</p>
          <p className="font-mono-num text-xl font-bold text-[#0B1F3A] mt-1">
            {summary.underOfferCount} dossiers
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                {cat === 'Tous' ? 'Toutes typologies' : `${cat}s`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Réf., acquéreur, agent..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D] w-56"
              />
            </div>

            <select
              aria-label="Filtrer par statut de transaction"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TransactionStatus | 'Toutes')
              }
              className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            >
              <option value="Toutes">Tous statuts</option>
              <option value="Signée">Signée</option>
              <option value="Sous compromis">Sous compromis</option>
              <option value="En attente">En attente</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-6 whitespace-nowrap">Référence</th>
                <th className="py-3 px-4 whitespace-nowrap">Bien</th>
                <th className="py-3 px-4 whitespace-nowrap">Acquéreur</th>
                <th className="py-3 px-4 whitespace-nowrap">Agent</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Montant</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Honoraires</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Statut</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <p>Aucune transaction trouvée.</p>
                    <button
                      type="button"
                      onClick={onOpenAddSale}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54]"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#C9A24D]" />
                      <span>Enregistrer une vente</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors h-11">
                    <td className="py-3 px-6 font-mono-num font-medium text-[#0B1F3A] whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#0B1F3A] whitespace-nowrap">
                        {tx.propertyTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.category} · {tx.location}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{tx.clientName}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.agentName}</td>
                    <td className="py-3 px-4 font-mono-num text-slate-500 whitespace-nowrap">
                      {formatDateFr(tx.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A] whitespace-nowrap">
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-[#9A7524] whitespace-nowrap">
                      {formatCurrency(tx.commission, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <TransactionStatusText status={tx.status} />
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <select
                          aria-label={`Changer le statut de ${tx.reference}`}
                          value={tx.status}
                          onChange={(e) =>
                            onUpdateStatus(tx.id, e.target.value as TransactionStatus)
                          }
                          className="text-[11px] border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                        >
                          <option value="Signée">Signée</option>
                          <option value="Sous compromis">Sous compromis</option>
                          <option value="En attente">En attente</option>
                          <option value="Annulée">Annulée</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          title={`Modifier ${tx.reference}`}
                          aria-label={`Modifier la vente ${tx.reference}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx)}
                          title={`Supprimer ${tx.reference}`}
                          aria-label={`Supprimer la vente ${tx.reference}`}
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
      </div>
    </div>
  );
}
