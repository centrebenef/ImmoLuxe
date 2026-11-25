import { useCallback, useEffect, useState } from 'react';
import { INITIAL_SETTINGS } from './data/mockData';
import {
  AgencySettings,
  Agent,
  Client,
  NavSection,
  Property,
  PropertyStatus,
  Transaction,
  TransactionStatus,
} from './types/immo';
import { AdminAuthScreen } from './components/AdminAuthScreen';
import { AgentsView } from './components/AgentsView';
import { ClientsView } from './components/ClientsView';
import { DashboardView } from './components/DashboardView';
import {
  AgentFormModal,
  ClientFormModal,
  ConfirmDeleteModal,
  PropertyDetailModal,
  PropertyFormModal,
  SaleFormModal,
} from './components/Modals';
import { PropertiesView } from './components/PropertiesView';
import { ReportsView } from './components/ReportsView';
import { SalesView } from './components/SalesView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';

type DeleteTarget =
  | { kind: 'property'; item: Property }
  | { kind: 'transaction'; item: Transaction }
  | { kind: 'client'; item: Client }
  | { kind: 'agent'; item: Agent }
  | { kind: 'all' }
  | null;

export default function App() {
  // In-memory Bearer session token (never stored in localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('');

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [settings, setSettings] = useState<AgencySettings>(INITIAL_SETTINGS);
  const [dataLoading, setDataLoading] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [agentFormOpen, setAgentFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!authToken) throw new Error('Non authentifié');
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${authToken}`);
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        setAuthToken(null);
        setAdminUsername('');
        throw new Error('Session expirée');
      }
      return res;
    },
    [authToken]
  );

  // Load protected dashboard data once authenticated
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    setDataLoading(true);
    authFetch('/api/data')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setProperties(data.properties ?? []);
        setTransactions(data.transactions ?? []);
        setClients(data.clients ?? []);
        setAgents(data.agents ?? []);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {
        // Handled by authFetch on 401
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, authFetch]);

  const handleAuthenticated = (token: string, username: string) => {
    setAuthToken(token);
    setAdminUsername(username);
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await authFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Clear local memory token regardless
    } finally {
      setAuthToken(null);
      setAdminUsername('');
      setProperties([]);
      setTransactions([]);
      setClients([]);
      setAgents([]);
      setSelectedProperty(null);
      setActiveSection('dashboard');
    }
  };

  const handlePrimaryTopBarAction = () => {
    if (activeSection === 'sales') {
      setEditingTransaction(null);
      setSaleFormOpen(true);
    } else if (activeSection === 'clients') {
      setEditingClient(null);
      setClientFormOpen(true);
    } else if (activeSection === 'agents') {
      setEditingAgent(null);
      setAgentFormOpen(true);
    } else {
      setEditingProperty(null);
      setPropertyFormOpen(true);
    }
  };

  // --- CRUD: Properties ---
  const handleSaveProperty = async (
    payload: Omit<Property, 'id' | 'reference' | 'views' | 'inquiries' | 'addedDate'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await authFetch(`/api/properties/${encodeURIComponent(existingId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = (await res.json()) as Property;
        setProperties((prev) => prev.map((p) => (p.id === existingId ? updated : p)));
        setSelectedProperty((prev) =>
          prev && prev.id === existingId ? updated : prev
        );
      }
      return;
    }

    const res = await authFetch('/api/properties', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as Property;
      setProperties((prev) => [created, ...prev]);
    }
  };

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: PropertyStatus) => {
    const res = await authFetch(`/api/properties/${encodeURIComponent(propertyId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Property;
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? updated : p)));
      setSelectedProperty((prev) =>
        prev && prev.id === propertyId ? updated : prev
      );
    }
  };

  // --- CRUD: Sales / Transactions ---
  const handleSaveSale = async (
    payload: Omit<Transaction, 'id' | 'reference'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await authFetch(`/api/transactions/${encodeURIComponent(existingId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = (await res.json()) as Transaction;
        setTransactions((prev) => prev.map((t) => (t.id === existingId ? updated : t)));
      }
      return;
    }

    const res = await authFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as Transaction;
      setTransactions((prev) => [created, ...prev]);
      if (created.propertyId) {
        if (created.status === 'Signée') {
          setProperties((prev) =>
            prev.map((p) => (p.id === created.propertyId ? { ...p, status: 'Vendu' } : p))
          );
        } else if (created.status === 'Sous compromis') {
          setProperties((prev) =>
            prev.map((p) =>
              p.id === created.propertyId ? { ...p, status: 'Sous offre' } : p
            )
          );
        }
      }
    }
  };

  const handleUpdateTransactionStatus = async (txId: string, status: TransactionStatus) => {
    const res = await authFetch(`/api/transactions/${encodeURIComponent(txId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Transaction;
      setTransactions((prev) => prev.map((t) => (t.id === txId ? updated : t)));
    }
  };

  // --- CRUD: Clients ---
  const handleSaveClient = async (
    payload: Omit<Client, 'id' | 'lastContact'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await authFetch(`/api/clients/${encodeURIComponent(existingId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = (await res.json()) as Client;
        setClients((prev) => prev.map((c) => (c.id === existingId ? updated : c)));
      }
      return;
    }

    const res = await authFetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as Client;
      setClients((prev) => [created, ...prev]);
    }
  };

  // --- CRUD: Agents ---
  const handleSaveAgent = async (
    payload: Omit<Agent, 'id' | 'initials'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await authFetch(`/api/agents/${encodeURIComponent(existingId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = (await res.json()) as Agent;
        setAgents((prev) => prev.map((a) => (a.id === existingId ? updated : a)));
      }
      return;
    }

    const res = await authFetch('/api/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as Agent;
      setAgents((prev) => [created, ...prev]);
    }
  };

  // --- Settings ---
  const handleSaveSettings = async (updated: AgencySettings) => {
    const res = await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const saved = (await res.json()) as AgencySettings;
      setSettings(saved);
    }
  };

  // --- Delete & Reset ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'property') {
      const targetId = deleteTarget.item.id;
      const res = await authFetch(`/api/properties/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== targetId));
        setSelectedProperty((prev) => (prev && prev.id === targetId ? null : prev));
      }
    } else if (deleteTarget.kind === 'transaction') {
      const targetId = deleteTarget.item.id;
      const res = await authFetch(`/api/transactions/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== targetId));
      }
    } else if (deleteTarget.kind === 'client') {
      const targetId = deleteTarget.item.id;
      const res = await authFetch(`/api/clients/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== targetId));
      }
    } else if (deleteTarget.kind === 'agent') {
      const targetId = deleteTarget.item.id;
      const res = await authFetch(`/api/agents/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== targetId));
      }
    } else if (deleteTarget.kind === 'all') {
      const res = await authFetch('/api/data/clear', { method: 'POST' });
      if (res.ok) {
        setProperties([]);
        setTransactions([]);
        setClients([]);
        setAgents([]);
        setSelectedProperty(null);
      }
    }
  };

  const handleRestoreInitialData = async () => {
    const res = await authFetch('/api/data/restore', { method: 'POST' });
    if (res.ok) {
      const data = (await res.json()) as {
        properties: Property[];
        transactions: Transaction[];
        clients: Client[];
        agents: Agent[];
      };
      setProperties(data.properties);
      setTransactions(data.transactions);
      setClients(data.clients);
      setAgents(data.agents);
    }
  };

  const deleteDialogContent = (() => {
    if (!deleteTarget) return { title: '', description: '', confirmLabel: 'Supprimer' };
    switch (deleteTarget.kind) {
      case 'property':
        return {
          title: `Supprimer « ${deleteTarget.item.title} » ?`,
          description: `Le mandat ${deleteTarget.item.reference} (${deleteTarget.item.city}) sera définitivement retiré du catalogue ImmoLuxe.`,
          confirmLabel: 'Supprimer le bien',
        };
      case 'transaction':
        return {
          title: `Supprimer la transaction ${deleteTarget.item.reference} ?`,
          description: `La vente liée à « ${deleteTarget.item.propertyTitle} » (${deleteTarget.item.clientName}) sera supprimée du registre.`,
          confirmLabel: 'Supprimer la vente',
        };
      case 'client':
        return {
          title: `Supprimer le client « ${deleteTarget.item.name} » ?`,
          description:
            'Cette fiche acquéreur et ses préférences de recherche seront retirées du portefeuille.',
          confirmLabel: 'Supprimer le client',
        };
      case 'agent':
        return {
          title: `Supprimer le conseiller « ${deleteTarget.item.name} » ?`,
          description:
            'Ce profil sera retiré de la liste des conseillers commerciaux actifs.',
          confirmLabel: 'Supprimer le conseiller',
        };
      case 'all':
        return {
          title: 'Supprimer toutes les données ?',
          description:
            'Tous les biens, transactions, clients et conseillers actuellement enregistrés seront effacés. Vous pourrez restaurer les données initiales à tout moment depuis les paramètres.',
          confirmLabel: 'Tout supprimer',
        };
    }
  })();

  if (!authToken) {
    return <AdminAuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        adminUsername={adminUsername}
        onLogout={() => {
          void handleLogout();
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeSection={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onPrimaryAction={handlePrimaryTopBarAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {dataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-slate-200 bg-white animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <DashboardView
                  properties={properties}
                  transactions={transactions}
                  clients={clients}
                  currency={settings.currency}
                  onSelectProperty={setSelectedProperty}
                  onEditProperty={(item) => {
                    setEditingProperty(item);
                    setPropertyFormOpen(true);
                  }}
                  onDeleteProperty={(item) => setDeleteTarget({ kind: 'property', item })}
                  onEditTransaction={(item) => {
                    setEditingTransaction(item);
                    setSaleFormOpen(true);
                  }}
                  onDeleteTransaction={(item) => setDeleteTarget({ kind: 'transaction', item })}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'properties' && (
                <PropertiesView
                  properties={properties}
                  agents={agents}
                  currency={settings.currency}
                  onSelectProperty={setSelectedProperty}
                  onEditProperty={(item) => {
                    setEditingProperty(item);
                    setPropertyFormOpen(true);
                  }}
                  onDeleteProperty={(item) => setDeleteTarget({ kind: 'property', item })}
                  onOpenAddProperty={() => {
                    setEditingProperty(null);
                    setPropertyFormOpen(true);
                  }}
                />
              )}

              {activeSection === 'sales' && (
                <SalesView
                  transactions={transactions}
                  currency={settings.currency}
                  onUpdateStatus={(id, status) => {
                    void handleUpdateTransactionStatus(id, status);
                  }}
                  onEditTransaction={(item) => {
                    setEditingTransaction(item);
                    setSaleFormOpen(true);
                  }}
                  onDeleteTransaction={(item) => setDeleteTarget({ kind: 'transaction', item })}
                  onOpenAddSale={() => {
                    setEditingTransaction(null);
                    setSaleFormOpen(true);
                  }}
                />
              )}

              {activeSection === 'clients' && (
                <ClientsView
                  clients={clients}
                  currency={settings.currency}
                  onEditClient={(item) => {
                    setEditingClient(item);
                    setClientFormOpen(true);
                  }}
                  onDeleteClient={(item) => setDeleteTarget({ kind: 'client', item })}
                  onOpenAddClient={() => {
                    setEditingClient(null);
                    setClientFormOpen(true);
                  }}
                />
              )}

              {activeSection === 'agents' && (
                <AgentsView
                  agents={agents}
                  properties={properties}
                  currency={settings.currency}
                  onViewAgentProperties={() => setActiveSection('properties')}
                  onOpenAddAgent={() => {
                    setEditingAgent(null);
                    setAgentFormOpen(true);
                  }}
                  onEditAgent={(item) => {
                    setEditingAgent(item);
                    setAgentFormOpen(true);
                  }}
                  onDeleteAgent={(item) => setDeleteTarget({ kind: 'agent', item })}
                />
              )}

              {activeSection === 'reports' && (
                <ReportsView
                  properties={properties}
                  transactions={transactions}
                  currency={settings.currency}
                />
              )}

              {activeSection === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={(updated) => {
                    void handleSaveSettings(updated);
                  }}
                  onRequestClearAllData={() => setDeleteTarget({ kind: 'all' })}
                  onRestoreInitialData={() => {
                    void handleRestoreInitialData();
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <PropertyDetailModal
        property={selectedProperty}
        agents={agents}
        currency={settings.currency}
        onClose={() => setSelectedProperty(null)}
        onUpdateStatus={(id, status) => {
          void handleUpdatePropertyStatus(id, status);
        }}
        onEditProperty={(item) => {
          setEditingProperty(item);
          setPropertyFormOpen(true);
        }}
        onDeleteProperty={(item) => setDeleteTarget({ kind: 'property', item })}
      />

      <PropertyFormModal
        open={propertyFormOpen}
        initialData={editingProperty}
        agents={agents}
        onClose={() => {
          setPropertyFormOpen(false);
          setEditingProperty(null);
        }}
        onSave={(payload, existingId) => {
          void handleSaveProperty(payload, existingId);
        }}
      />

      <SaleFormModal
        open={saleFormOpen}
        initialData={editingTransaction}
        properties={properties}
        agents={agents}
        commissionRate={settings.defaultCommissionRate}
        onClose={() => {
          setSaleFormOpen(false);
          setEditingTransaction(null);
        }}
        onSave={(payload, existingId) => {
          void handleSaveSale(payload, existingId);
        }}
      />

      <ClientFormModal
        open={clientFormOpen}
        initialData={editingClient}
        agents={agents}
        onClose={() => {
          setClientFormOpen(false);
          setEditingClient(null);
        }}
        onSave={(payload, existingId) => {
          void handleSaveClient(payload, existingId);
        }}
      />

      <AgentFormModal
        open={agentFormOpen}
        initialData={editingAgent}
        onClose={() => {
          setAgentFormOpen(false);
          setEditingAgent(null);
        }}
        onSave={(payload, existingId) => {
          void handleSaveAgent(payload, existingId);
        }}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={deleteDialogContent.title}
        description={deleteDialogContent.description}
        confirmLabel={deleteDialogContent.confirmLabel}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
