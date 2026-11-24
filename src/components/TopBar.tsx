import { Menu, Plus } from 'lucide-react';
import { NavSection } from '../types/immo';

interface TopBarProps {
  activeSection: NavSection;
  onOpenMobileMenu: () => void;
  onPrimaryAction: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Tableau de bord',
  properties: 'Biens immobiliers',
  sales: 'Ventes',
  clients: 'Clients',
  agents: 'Agents',
  reports: 'Rapports',
  settings: 'Paramètres',
};

export function TopBar({
  activeSection,
  onOpenMobileMenu,
  onPrimaryAction,
}: TopBarProps) {
  const actionLabel =
    activeSection === 'sales'
      ? 'Nouvelle vente'
      : activeSection === 'clients'
        ? 'Nouveau client'
        : activeSection === 'agents'
          ? 'Nouveau conseiller'
          : 'Nouveau bien';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white border-b border-slate-200 px-4 sm:px-8 h-16 shrink-0">
      {/* Zone 1: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A]"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Fil d’Ariane" className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-display font-semibold text-[#0B1F3A] whitespace-nowrap shrink-0">
            ImmoLuxe
          </span>
          <span className="text-slate-300 shrink-0" aria-hidden="true">
            /
          </span>
          <h1 className="font-medium text-slate-600 truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
        </nav>
      </div>

      {/* Zone 2: Single Primary Action */}
      <div className="flex items-center shrink-0">
        {activeSection !== 'reports' && activeSection !== 'settings' && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132F54] active:translate-y-[0.5px] transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"
          >
            <Plus className="h-4 w-4 text-[#C9A24D]" strokeWidth={2.25} />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
