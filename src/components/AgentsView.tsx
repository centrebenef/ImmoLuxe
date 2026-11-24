import { Mail, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { Agent, CurrencyCode, Property } from '../types/immo';
import { formatCompactCurrency } from '../utils/format';

interface AgentsViewProps {
  agents: Agent[];
  properties: Property[];
  currency: CurrencyCode;
  onViewAgentProperties: () => void;
  onOpenAddAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
}

export function AgentsView({
  agents,
  properties,
  currency,
  onViewAgentProperties,
  onOpenAddAgent,
  onEditAgent,
  onDeleteAgent,
}: AgentsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
          Conseillers &amp; direction commerciale
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Performance individuelle, volume généré et mandats actifs par secteur
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="font-display text-base font-semibold text-[#0B1F3A]">
            Aucun conseiller enregistré
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ajoutez un nouveau conseiller ou restaurez les données depuis les paramètres.
          </p>
          <button
            type="button"
            onClick={onOpenAddAgent}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54]"
          >
            <Plus className="h-3.5 w-3.5 text-[#C9A24D]" />
            <span>Ajouter un conseiller</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agents.map((agent) => {
            const liveListings = properties.filter((p) => p.agentId === agent.id).length;
            return (
              <div
                key={agent.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {agent.avatarUrl ? (
                      <img
                        src={agent.avatarUrl}
                        alt={agent.name}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-full object-cover border border-[#C9A24D] shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-[#0B1F3A] text-[#C9A24D] font-display font-bold text-lg flex items-center justify-center shrink-0">
                        {agent.initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-[#0B1F3A] truncate">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-slate-600 truncate">{agent.role}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-[#C9A24D] shrink-0" />
                        <span>{agent.region}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditAgent(agent)}
                      title={`Modifier ${agent.name}`}
                      aria-label={`Modifier le conseiller ${agent.name}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAgent(agent)}
                      title={`Supprimer ${agent.name}`}
                      aria-label={`Supprimer le conseiller ${agent.name}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                <div>
                  <p className="text-[11px] text-slate-500">Volume vendu</p>
                  <p className="font-mono-num text-sm font-bold text-[#0B1F3A] mt-0.5">
                    {formatCompactCurrency(agent.revenueGenerated, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Ventes conclues</p>
                  <p className="font-mono-num text-sm font-bold text-[#0B1F3A] mt-0.5">
                    {agent.salesCount} biens
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Transformation</p>
                  <p className="font-mono-num text-sm font-bold text-[#9A7524] mt-0.5">
                    {agent.conversionRate.toFixed(1).replace('.', ',')} %
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-600">
                  <a
                    href={`mailto:${agent.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-[#0B1F3A]"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{agent.email}</span>
                  </a>
                  <span className="inline-flex items-center gap-1.5 font-mono-num text-slate-500">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{agent.phone}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onViewAgentProperties}
                  className="text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7524] transition-colors whitespace-nowrap"
                >
                  {liveListings || agent.activeListings} mandats actifs →
                </button>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
