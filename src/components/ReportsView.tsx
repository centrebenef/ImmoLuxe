import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { CurrencyCode, Property, PropertyCategory, Transaction } from '../types/immo';
import { formatCompactCurrency, formatCurrency } from '../utils/format';

interface ReportsViewProps {
  properties: Property[];
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function ReportsView({ properties, transactions, currency }: ReportsViewProps) {
  const categoryStats = useMemo(() => {
    const categories: PropertyCategory[] = ['Villa', 'Appartement', 'Studio', 'Terrain'];
    return categories.map((cat) => {
      const catProps = properties.filter((p) => p.category === cat);
      const catTx = transactions.filter((t) => t.category === cat && t.status !== 'Annulée');
      const volume = catTx.reduce((s, t) => s + t.amount, 0);
      const commission = catTx.reduce((s, t) => s + t.commission, 0);
      const avgPrice =
        catProps.length > 0
          ? Math.round(catProps.reduce((s, p) => s + p.price, 0) / catProps.length)
          : 0;
      return {
        category: cat,
        listings: catProps.length,
        txCount: catTx.length,
        volume,
        commission,
        avgPrice,
      };
    });
  }, [properties, transactions]);

  const maxCategoryVolume = Math.max(...categoryStats.map((c) => c.volume), 1);

  const funnelStages = [
    { stage: 'Visites & demandes qualifiées', count: 148, rate: '100 %' },
    { stage: 'Visites privées effectuées', count: 94, rate: '63,5 %' },
    { stage: 'Offres d’achat formalisées', count: 49, rate: '33,1 %' },
    { stage: 'Compromis & actes signés', count: 38, rate: '25,7 %' },
  ];

  const handleDownloadReport = () => {
    const lines = [
      'Typologie;Mandats;Transactions;Volume;Honoraires;Prix moyen',
      ...categoryStats.map(
        (c) =>
          `${c.category};${c.listings};${c.txCount};${c.volume};${c.commission};${c.avgPrice}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'rapport_analytique_immoluxe.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Rapports financiers &amp; analytiques
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Rendement par typologie de bien et entonnoir de conversion commerciale
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54] transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5 text-[#C9A24D]" />
          <span>Exporter le rapport CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Volume by category bar breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0B1F3A]">
              Volume transactionnel par typologie
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ventes actées et sous compromis consolidées
            </p>
          </div>

          <div className="space-y-4">
            {categoryStats.map((item) => {
              const pct = Math.max(Math.round((item.volume / maxCategoryVolume) * 100), 4);
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B1F3A]">
                      {item.category}s ·{' '}
                      <span className="text-slate-500 font-normal">
                        {item.txCount} {item.txCount > 1 ? 'dossiers' : 'dossier'}
                      </span>
                    </span>
                    <span className="font-mono-num font-semibold text-[#0B1F3A]">
                      {formatCurrency(item.volume, currency)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          item.category === 'Villa'
                            ? '#0B1F3A'
                            : item.category === 'Appartement'
                              ? '#C9A24D'
                              : item.category === 'Terrain'
                                ? '#3B5B8C'
                                : '#64748B',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0B1F3A]">
              Tunnel de conversion acquéreurs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Du premier contact qualifié à la signature chez le notaire
            </p>
          </div>

          <div className="space-y-3">
            {funnelStages.map((step, index) => (
              <div
                key={step.stage}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-num text-xs font-semibold text-[#9A7524] w-5 shrink-0">
                    0{index + 1}.
                  </span>
                  <span className="text-xs font-medium text-[#0B1F3A] truncate">
                    {step.stage}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono-num text-xs font-bold text-[#0B1F3A]">
                    {step.count}
                  </span>
                  <span className="font-mono-num text-[11px] text-slate-500 ml-2">
                    ({step.rate})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-display text-base font-semibold text-[#0B1F3A]">
            Synthèse financière détaillée
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-6">Typologie</th>
                <th className="py-3 px-4 text-right">Biens en portefeuille</th>
                <th className="py-3 px-4 text-right">Dossiers actifs/signés</th>
                <th className="py-3 px-4 text-right">Ticket moyen catalogue</th>
                <th className="py-3 px-4 text-right">Volume transactionnel</th>
                <th className="py-3 px-6 text-right">Honoraires générés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {categoryStats.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50/80 h-11">
                  <td className="py-3 px-6 font-medium text-[#0B1F3A]">{row.category}s</td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                    {row.listings}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                    {row.txCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                    {formatCompactCurrency(row.avgPrice, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A]">
                    {formatCurrency(row.volume, currency)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono-num font-semibold text-[#9A7524]">
                    {formatCurrency(row.commission, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
