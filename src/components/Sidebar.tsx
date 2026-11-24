import {
  BarChart3,
  Building2,
  Handshake,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { IMAGE_PATHS } from '../data/mockData';
import { NavSection } from '../types/immo';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  adminUsername: string;
  onLogout: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'properties', label: 'Biens immobiliers', icon: Building2 },
  { id: 'sales', label: 'Ventes', icon: Handshake },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'agents', label: 'Agents', icon: UserCheck },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  adminUsername,
  onLogout,
}: SidebarProps) {
  const handleSelect = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B1F3A] text-white w-[260px] select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D] rounded-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A24D] text-[#0B1F3A] font-display font-bold text-base tracking-tight shrink-0">
            IL
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap">
            ImmoLuxe
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D] ${
                isActive
                  ? 'bg-[#132F54] text-[#E6C574]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? 'text-[#C9A24D]' : 'text-slate-400'
                }`}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Profile Footer & Logout */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={IMAGE_PATHS.directorAvatar}
              alt={adminUsername}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover border border-[#C9A24D]/60 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminUsername}</p>
              <p className="text-xs text-[#E6C574] truncate">Administrateur</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block shrink-0 border-r border-slate-200">{sidebarContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full shadow-2xl">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
