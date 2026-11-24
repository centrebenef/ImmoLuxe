import { useMemo, useState } from 'react';
import { Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { Client, CurrencyCode } from '../types/immo';
import { formatCurrency, formatDateFr } from '../utils/format';

interface ClientsViewProps {
  clients: Client[];
  currency: CurrencyCode;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onOpenAddClient: () => void;
}

export function ClientsView({
  clients,
  currency,
  onEditClient,
  onDeleteClient,
  onOpenAddClient,
}: ClientsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Client['status'] | 'Tous'>('Tous');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter !== 'Tous' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.assignedAgent.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Portefeuille clients &amp; acquéreurs
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {clients.length} profils qualifiés suivis par l’équipe commerciale
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['Tous', 'Actif', 'En négociation', 'Acquéreur'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, secteur, conseiller..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D] w-60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-6 whitespace-nowrap">Client</th>
                <th className="py-3 px-4 whitespace-nowrap">Coordonnées</th>
                <th className="py-3 px-4 whitespace-nowrap">Recherche</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Budget max.</th>
                <th className="py-3 px-4 whitespace-nowrap">Agent dédié</th>
                <th className="py-3 px-4 whitespace-nowrap">Dernier échange</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Statut</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <p>Aucun client ne correspond à votre recherche.</p>
                    <button
                      type="button"
                      onClick={onOpenAddClient}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54]"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#C9A24D]" />
                      <span>Ajouter un client</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-medium text-[#0B1F3A] whitespace-nowrap">{client.name}</p>
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">{client.city}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <a
                          href={`mailto:${client.email}`}
                          className="inline-flex items-center gap-1.5 hover:text-[#0B1F3A] whitespace-nowrap"
                        >
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{client.email}</span>
                        </a>
                        <span className="inline-flex items-center gap-1.5 font-mono-num text-[11px] text-slate-500 whitespace-nowrap">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{client.phone}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {client.preferredCategory}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-[#0B1F3A] whitespace-nowrap">
                      {formatCurrency(client.budgetMax, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {client.assignedAgent}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-slate-500 whitespace-nowrap">
                      {formatDateFr(client.lastContact)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-medium ${
                          client.status === 'Acquéreur'
                            ? 'text-emerald-700'
                            : client.status === 'En négociation'
                              ? 'text-[#9A7524]'
                              : 'text-[#0B1F3A]'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditClient(client)}
                          title={`Modifier ${client.name}`}
                          aria-label={`Modifier le client ${client.name}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteClient(client)}
                          title={`Supprimer ${client.name}`}
                          aria-label={`Supprimer le client ${client.name}`}
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
