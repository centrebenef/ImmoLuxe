export type NavSection =
  | 'dashboard'
  | 'properties'
  | 'sales'
  | 'clients'
  | 'agents'
  | 'reports'
  | 'settings';

export type PropertyCategory = 'Villa' | 'Appartement' | 'Studio' | 'Terrain';

export type PropertyStatus = 'Disponible' | 'Sous offre' | 'Vendu';

export type TransactionStatus = 'Signée' | 'Sous compromis' | 'En attente' | 'Annulée';

export type TimeframeKey = 'month' | 'quarter' | 'year';

export interface Property {
  id: string;
  reference: string;
  title: string;
  category: PropertyCategory;
  location: string;
  city: string;
  price: number;
  surface: number;
  rooms?: number;
  status: PropertyStatus;
  views: number;
  inquiries: number;
  imageUrl: string;
  agentId: string;
  featured: boolean;
  description: string;
  addedDate: string;
}

export interface Transaction {
  id: string;
  reference: string;
  propertyId: string;
  propertyTitle: string;
  category: PropertyCategory;
  location: string;
  clientName: string;
  agentName: string;
  date: string;
  amount: number;
  commission: number;
  status: TransactionStatus;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  preferredCategory: PropertyCategory;
  budgetMax: number;
  status: 'Actif' | 'En négociation' | 'Acquéreur';
  assignedAgent: string;
  lastContact: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  region: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  initials: string;
  salesCount: number;
  revenueGenerated: number;
  activeListings: number;
  conversionRate: number;
}

export interface RevenueSeriesPoint {
  label: string;
  revenue: number;
  profit: number;
  salesCount: number;
}

export type CurrencyCode = 'MAD' | 'EUR' | 'CHF';

export interface AgencySettings {
  companyName: string;
  siret: string;
  headquarters: string;
  email: string;
  phone: string;
  defaultCommissionRate: number;
  currency: CurrencyCode;
  autoReportFrequency: 'Hebdomadaire' | 'Mensuel' | 'Trimestriel';
  notifyNewOffer: boolean;
  notifySignedSale: boolean;
  notifyWeeklyDigest: boolean;
}
