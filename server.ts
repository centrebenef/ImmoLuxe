import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  INITIAL_AGENTS,
  INITIAL_CLIENTS,
  INITIAL_PROPERTIES,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from './src/data/mockData.ts';
import type {
  AgencySettings,
  Agent,
  Client,
  Property,
  PropertyCategory,
  PropertyStatus,
  Transaction,
  TransactionStatus,
} from './src/types/immo.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const ALLOWED_CATEGORIES: readonly PropertyCategory[] = [
  'Villa',
  'Appartement',
  'Studio',
  'Terrain',
];
const ALLOWED_PROP_STATUSES: readonly PropertyStatus[] = ['Disponible', 'Sous offre', 'Vendu'];
const ALLOWED_TX_STATUSES: readonly TransactionStatus[] = [
  'Signée',
  'Sous compromis',
  'En attente',
  'Annulée',
];

interface AdminCredentialRecord {
  username: string;
  salt: string;
  hash: string;
}

interface SessionPayload {
  sub: string;
  jti: string;
  exp: number;
}

// --- Password Hashing (scrypt + timingSafeEqual) ---
function hashPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password: string, salt: string, expectedHashHex: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function constantTimeStringMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- Admin Credentials State ---
// If ADMIN_PASSWORD is configured in process.env, derive its scrypt hash at boot.
// Otherwise, wait for the one-time first-run admin setup (/api/auth/setup).
function getEnvCredential(): AdminCredentialRecord | null {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (!envPass) return null;
  const envUser = process.env.ADMIN_USERNAME?.trim() || 'immo';
  const { salt, hash } = hashPassword(envPass);
  return { username: envUser, salt, hash };
}

const envAdminRecord = getEnvCredential();
let claimedAdminRecord: AdminCredentialRecord | null = null;

function getActiveAdminRecord(): AdminCredentialRecord | null {
  return envAdminRecord ?? claimedAdminRecord;
}

// --- Signed Bearer Session Tokens (stored in server Set for revocation) ---
const activeSessionIds = new Set<string>();

function createSessionToken(username: string): string {
  const jti = crypto.randomBytes(16).toString('hex');
  const payload: SessionPayload = {
    sub: username,
    jti,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  activeSessionIds.add(jti);
  return `${encoded}.${signature}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  if (!constantTimeStringMatch(providedSig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.sub || !parsed.jti || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) {
      activeSessionIds.delete(parsed.jti);
      return null;
    }
    if (!activeSessionIds.has(parsed.jti)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// --- Lightweight Login Rate Limiter ---
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count += 1;
  return true;
}

// --- Server-side Application Store ---
let propertiesStore: Property[] = structuredClone(INITIAL_PROPERTIES);
let transactionsStore: Transaction[] = structuredClone(INITIAL_TRANSACTIONS);
let clientsStore: Client[] = structuredClone(INITIAL_CLIENTS);
let agentsStore: Agent[] = structuredClone(INITIAL_AGENTS);
let settingsStore: AgencySettings = structuredClone(INITIAL_SETTINGS);

interface AuthedRequest extends Request {
  adminSession?: SessionPayload;
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification administrateur requise.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'Session expirée ou invalide.' });
    return;
  }
  req.adminSession = session;
  next();
}

function isNonEmptyString(val: unknown, maxLen = 200): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.trim().length <= maxLen;
}

function isFinitePositive(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // --- Auth Routes ---
  app.get('/api/auth/status', (_req: Request, res: Response) => {
    const active = getActiveAdminRecord();
    res.json({
      configured: active !== null,
      defaultUsername: process.env.ADMIN_USERNAME?.trim() || 'immo',
    });
  });

  app.post('/api/auth/setup', (req: Request, res: Response) => {
    if (getActiveAdminRecord() !== null) {
      res.status(409).json({
        error: 'Le compte administrateur est déjà configuré.',
      });
      return;
    }

    const { username, password } = req.body ?? {};
    if (!isNonEmptyString(username, 64) || typeof password !== 'string' || password.length < 4 || password.length > 128) {
      res.status(400).json({
        error: 'Veuillez saisir un identifiant valide et un mot de passe d’au moins 4 caractères.',
      });
      return;
    }

    const cleanUser = username.trim();
    const { salt, hash } = hashPassword(password);
    claimedAdminRecord = { username: cleanUser, salt, hash };

    const token = createSessionToken(cleanUser);
    res.status(201).json({
      token,
      admin: { username: cleanUser },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Trop de tentatives. Veuillez réessayer dans une minute.',
      });
      return;
    }

    const active = getActiveAdminRecord();
    if (!active) {
      res.status(409).json({
        error: 'Aucun administrateur configuré. Veuillez initialiser le compte.',
      });
      return;
    }

    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
      return;
    }

    const userMatch = constantTimeStringMatch(username.trim(), active.username);
    const passMatch = verifyPassword(password, active.salt, active.hash);

    if (!userMatch || !passMatch) {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }

    const token = createSessionToken(active.username);
    res.json({
      token,
      admin: { username: active.username },
    });
  });

  app.get('/api/auth/me', requireAdmin, (req: AuthedRequest, res: Response) => {
    res.json({ admin: { username: req.adminSession!.sub } });
  });

  app.post('/api/auth/logout', requireAdmin, (req: AuthedRequest, res: Response) => {
    if (req.adminSession) {
      activeSessionIds.delete(req.adminSession.jti);
    }
    res.json({ ok: true });
  });

  // --- Protected Dashboard CRUD Routes ---
  app.get('/api/data', requireAdmin, (_req: AuthedRequest, res: Response) => {
    res.json({
      properties: propertiesStore,
      transactions: transactionsStore,
      clients: clientsStore,
      agents: agentsStore,
      settings: settingsStore,
    });
  });

  // Properties CRUD
  app.post('/api/properties', requireAdmin, (req: AuthedRequest, res: Response) => {
    const body = req.body ?? {};
    if (
      !isNonEmptyString(body.title, 160) ||
      !ALLOWED_CATEGORIES.includes(body.category) ||
      !isNonEmptyString(body.city, 100) ||
      !isFinitePositive(body.price) ||
      !isFinitePositive(body.surface)
    ) {
      res.status(400).json({ error: 'Données du bien invalides.' });
      return;
    }

    const prefix = String(body.category).slice(0, 3).toUpperCase();
    const num = String(propertiesStore.length + 215).padStart(3, '0');
    const created: Property = {
      id: `prop-${Date.now()}`,
      reference: `IML-${prefix}-${num}`,
      title: body.title.trim(),
      category: body.category,
      location: isNonEmptyString(body.location, 120) ? body.location.trim() : body.city.trim(),
      city: body.city.trim(),
      price: body.price,
      surface: body.surface,
      rooms:
        body.category === 'Terrain'
          ? undefined
          : typeof body.rooms === 'number' && body.rooms >= 1
            ? body.rooms
            : 1,
      status: ALLOWED_PROP_STATUSES.includes(body.status) ? body.status : 'Disponible',
      views: 1,
      inquiries: 0,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
      agentId: typeof body.agentId === 'string' ? body.agentId : '',
      featured: Boolean(body.featured ?? true),
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim().slice(0, 1000)
          : 'Bien immobilier de prestige sélectionné par ImmoLuxe.',
      addedDate: new Date().toISOString().slice(0, 10),
    };

    propertiesStore = [created, ...propertiesStore];
    res.status(201).json(created);
  });

  app.put('/api/properties/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const existing = propertiesStore.find((p) => p.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Bien introuvable.' });
      return;
    }
    const body = req.body ?? {};
    if (
      !isNonEmptyString(body.title, 160) ||
      !ALLOWED_CATEGORIES.includes(body.category) ||
      !isNonEmptyString(body.city, 100) ||
      !isFinitePositive(body.price) ||
      !isFinitePositive(body.surface)
    ) {
      res.status(400).json({ error: 'Données du bien invalides.' });
      return;
    }

    const updated: Property = {
      ...existing,
      title: body.title.trim(),
      category: body.category,
      location: isNonEmptyString(body.location, 120) ? body.location.trim() : body.city.trim(),
      city: body.city.trim(),
      price: body.price,
      surface: body.surface,
      rooms:
        body.category === 'Terrain'
          ? undefined
          : typeof body.rooms === 'number' && body.rooms >= 1
            ? body.rooms
            : existing.rooms ?? 1,
      status: ALLOWED_PROP_STATUSES.includes(body.status) ? body.status : existing.status,
      agentId: typeof body.agentId === 'string' ? body.agentId : existing.agentId,
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim().slice(0, 1000)
          : existing.description,
    };

    propertiesStore = propertiesStore.map((p) => (p.id === id ? updated : p));
    res.json(updated);
  });

  app.patch('/api/properties/:id/status', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const status = req.body?.status;
    if (!ALLOWED_PROP_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Statut invalide.' });
      return;
    }
    const existing = propertiesStore.find((p) => p.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Bien introuvable.' });
      return;
    }
    const updated: Property = { ...existing, status };
    propertiesStore = propertiesStore.map((p) => (p.id === id ? updated : p));
    res.json(updated);
  });

  app.delete('/api/properties/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    propertiesStore = propertiesStore.filter((p) => p.id !== id);
    res.json({ ok: true });
  });

  // Transactions CRUD
  app.post('/api/transactions', requireAdmin, (req: AuthedRequest, res: Response) => {
    const body = req.body ?? {};
    if (
      !isNonEmptyString(body.propertyTitle, 160) ||
      !isNonEmptyString(body.clientName, 160) ||
      !isFinitePositive(body.amount) ||
      !ALLOWED_CATEGORIES.includes(body.category) ||
      !ALLOWED_TX_STATUSES.includes(body.status)
    ) {
      res.status(400).json({ error: 'Données de transaction invalides.' });
      return;
    }

    const num = String(90 + transactionsStore.length).padStart(3, '0');
    const created: Transaction = {
      id: `tx-${Date.now()}`,
      reference: `VNT-2026-${num}`,
      propertyId: typeof body.propertyId === 'string' ? body.propertyId : '',
      propertyTitle: body.propertyTitle.trim(),
      category: body.category,
      location: isNonEmptyString(body.location, 120) ? body.location.trim() : 'Casablanca',
      clientName: body.clientName.trim(),
      agentName: isNonEmptyString(body.agentName, 120) ? body.agentName.trim() : 'Équipe ImmoLuxe',
      date: isNonEmptyString(body.date, 20) ? body.date.trim() : new Date().toISOString().slice(0, 10),
      amount: body.amount,
      commission: isFinitePositive(body.commission)
        ? body.commission
        : Math.round((body.amount * settingsStore.defaultCommissionRate) / 100),
      status: body.status,
    };

    transactionsStore = [created, ...transactionsStore];
    if (created.propertyId) {
      if (created.status === 'Signée') {
        propertiesStore = propertiesStore.map((p) =>
          p.id === created.propertyId ? { ...p, status: 'Vendu' } : p
        );
      } else if (created.status === 'Sous compromis') {
        propertiesStore = propertiesStore.map((p) =>
          p.id === created.propertyId ? { ...p, status: 'Sous offre' } : p
        );
      }
    }
    res.status(201).json(created);
  });

  app.put('/api/transactions/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const existing = transactionsStore.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Transaction introuvable.' });
      return;
    }
    const body = req.body ?? {};
    if (
      !isNonEmptyString(body.propertyTitle, 160) ||
      !isNonEmptyString(body.clientName, 160) ||
      !isFinitePositive(body.amount) ||
      !ALLOWED_TX_STATUSES.includes(body.status)
    ) {
      res.status(400).json({ error: 'Données de transaction invalides.' });
      return;
    }

    const updated: Transaction = {
      ...existing,
      propertyId: typeof body.propertyId === 'string' ? body.propertyId : existing.propertyId,
      propertyTitle: body.propertyTitle.trim(),
      category: ALLOWED_CATEGORIES.includes(body.category) ? body.category : existing.category,
      location: isNonEmptyString(body.location, 120) ? body.location.trim() : existing.location,
      clientName: body.clientName.trim(),
      agentName: isNonEmptyString(body.agentName, 120) ? body.agentName.trim() : existing.agentName,
      date: isNonEmptyString(body.date, 20) ? body.date.trim() : existing.date,
      amount: body.amount,
      commission: isFinitePositive(body.commission)
        ? body.commission
        : Math.round((body.amount * settingsStore.defaultCommissionRate) / 100),
      status: body.status,
    };

    transactionsStore = transactionsStore.map((t) => (t.id === id ? updated : t));
    res.json(updated);
  });

  app.patch('/api/transactions/:id/status', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const status = req.body?.status;
    if (!ALLOWED_TX_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Statut invalide.' });
      return;
    }
    const existing = transactionsStore.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Transaction introuvable.' });
      return;
    }
    const updated: Transaction = { ...existing, status };
    transactionsStore = transactionsStore.map((t) => (t.id === id ? updated : t));
    res.json(updated);
  });

  app.delete('/api/transactions/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    transactionsStore = transactionsStore.filter((t) => t.id !== id);
    res.json({ ok: true });
  });

  // Clients CRUD
  app.post('/api/clients', requireAdmin, (req: AuthedRequest, res: Response) => {
    const body = req.body ?? {};
    if (!isNonEmptyString(body.name, 140) || !isNonEmptyString(body.email, 160)) {
      res.status(400).json({ error: 'Nom et e-mail requis.' });
      return;
    }

    const created: Client = {
      id: `cl-${Date.now()}`,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : '+212 6 00 00 00 00',
      city: isNonEmptyString(body.city, 100) ? body.city.trim() : 'Casablanca',
      preferredCategory: ALLOWED_CATEGORIES.includes(body.preferredCategory)
        ? body.preferredCategory
        : 'Villa',
      budgetMax: isFinitePositive(body.budgetMax) ? body.budgetMax : 1_000_000,
      status:
        body.status === 'Acquéreur' || body.status === 'En négociation'
          ? body.status
          : 'Actif',
      assignedAgent: isNonEmptyString(body.assignedAgent, 120)
        ? body.assignedAgent.trim()
        : 'Équipe ImmoLuxe',
      lastContact: new Date().toISOString().slice(0, 10),
    };

    clientsStore = [created, ...clientsStore];
    res.status(201).json(created);
  });

  app.put('/api/clients/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const existing = clientsStore.find((c) => c.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Client introuvable.' });
      return;
    }
    const body = req.body ?? {};
    if (!isNonEmptyString(body.name, 140) || !isNonEmptyString(body.email, 160)) {
      res.status(400).json({ error: 'Nom et e-mail requis.' });
      return;
    }

    const updated: Client = {
      ...existing,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : existing.phone,
      city: isNonEmptyString(body.city, 100) ? body.city.trim() : existing.city,
      preferredCategory: ALLOWED_CATEGORIES.includes(body.preferredCategory)
        ? body.preferredCategory
        : existing.preferredCategory,
      budgetMax: isFinitePositive(body.budgetMax) ? body.budgetMax : existing.budgetMax,
      status:
        body.status === 'Acquéreur' || body.status === 'En négociation' || body.status === 'Actif'
          ? body.status
          : existing.status,
      assignedAgent: isNonEmptyString(body.assignedAgent, 120)
        ? body.assignedAgent.trim()
        : existing.assignedAgent,
      lastContact: new Date().toISOString().slice(0, 10),
    };

    clientsStore = clientsStore.map((c) => (c.id === id ? updated : c));
    res.json(updated);
  });

  app.delete('/api/clients/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    clientsStore = clientsStore.filter((c) => c.id !== id);
    res.json({ ok: true });
  });

  // Agents CRUD
  app.post('/api/agents', requireAdmin, (req: AuthedRequest, res: Response) => {
    const body = req.body ?? {};
    if (!isNonEmptyString(body.name, 140) || !isNonEmptyString(body.email, 160)) {
      res.status(400).json({ error: 'Nom et e-mail requis.' });
      return;
    }
    const parts = body.name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : body.name.trim().slice(0, 2).toUpperCase();

    const created: Agent = {
      id: `ag-${Date.now()}`,
      name: body.name.trim(),
      role: isNonEmptyString(body.role, 140) ? body.role.trim() : 'Conseiller Immobilier',
      region: isNonEmptyString(body.region, 140) ? body.region.trim() : 'Casablanca & Rabat',
      email: body.email.trim(),
      phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : '+212 6 00 00 00 00',
      initials,
      salesCount: isFinitePositive(body.salesCount) ? body.salesCount : 0,
      revenueGenerated: isFinitePositive(body.revenueGenerated) ? body.revenueGenerated : 0,
      activeListings: isFinitePositive(body.activeListings) ? body.activeListings : 0,
      conversionRate: isFinitePositive(body.conversionRate) ? body.conversionRate : 0,
    };

    agentsStore = [created, ...agentsStore];
    res.status(201).json(created);
  });

  app.put('/api/agents/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const existing = agentsStore.find((a) => a.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Conseiller introuvable.' });
      return;
    }
    const body = req.body ?? {};
    if (!isNonEmptyString(body.name, 140) || !isNonEmptyString(body.email, 160)) {
      res.status(400).json({ error: 'Nom et e-mail requis.' });
      return;
    }
    const parts = body.name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : body.name.trim().slice(0, 2).toUpperCase();

    const updated: Agent = {
      ...existing,
      name: body.name.trim(),
      role: isNonEmptyString(body.role, 140) ? body.role.trim() : existing.role,
      region: isNonEmptyString(body.region, 140) ? body.region.trim() : existing.region,
      email: body.email.trim(),
      phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : existing.phone,
      initials,
      salesCount: isFinitePositive(body.salesCount) ? body.salesCount : existing.salesCount,
      revenueGenerated: isFinitePositive(body.revenueGenerated)
        ? body.revenueGenerated
        : existing.revenueGenerated,
      conversionRate: isFinitePositive(body.conversionRate)
        ? body.conversionRate
        : existing.conversionRate,
    };

    agentsStore = agentsStore.map((a) => (a.id === id ? updated : a));
    res.json(updated);
  });

  app.delete('/api/agents/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    agentsStore = agentsStore.filter((a) => a.id !== id);
    res.json({ ok: true });
  });

  // Settings & Bulk Reset
  app.put('/api/settings', requireAdmin, (req: AuthedRequest, res: Response) => {
    const body = req.body ?? {};
    settingsStore = {
      ...settingsStore,
      companyName: isNonEmptyString(body.companyName, 160)
        ? body.companyName.trim()
        : settingsStore.companyName,
      siret: isNonEmptyString(body.siret, 60) ? body.siret.trim() : settingsStore.siret,
      headquarters: isNonEmptyString(body.headquarters, 200)
        ? body.headquarters.trim()
        : settingsStore.headquarters,
      email: isNonEmptyString(body.email, 160) ? body.email.trim() : settingsStore.email,
      phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : settingsStore.phone,
      defaultCommissionRate:
        typeof body.defaultCommissionRate === 'number' &&
        body.defaultCommissionRate >= 0.5 &&
        body.defaultCommissionRate <= 25
          ? body.defaultCommissionRate
          : settingsStore.defaultCommissionRate,
      currency:
        body.currency === 'MAD' || body.currency === 'EUR' || body.currency === 'CHF'
          ? body.currency
          : settingsStore.currency,
      autoReportFrequency:
        body.autoReportFrequency === 'Hebdomadaire' ||
        body.autoReportFrequency === 'Mensuel' ||
        body.autoReportFrequency === 'Trimestriel'
          ? body.autoReportFrequency
          : settingsStore.autoReportFrequency,
      notifyNewOffer:
        typeof body.notifyNewOffer === 'boolean'
          ? body.notifyNewOffer
          : settingsStore.notifyNewOffer,
      notifySignedSale:
        typeof body.notifySignedSale === 'boolean'
          ? body.notifySignedSale
          : settingsStore.notifySignedSale,
      notifyWeeklyDigest:
        typeof body.notifyWeeklyDigest === 'boolean'
          ? body.notifyWeeklyDigest
          : settingsStore.notifyWeeklyDigest,
    };
    res.json(settingsStore);
  });

  app.post('/api/data/clear', requireAdmin, (_req: AuthedRequest, res: Response) => {
    propertiesStore = [];
    transactionsStore = [];
    clientsStore = [];
    agentsStore = [];
    res.json({ ok: true });
  });

  app.post('/api/data/restore', requireAdmin, (_req: AuthedRequest, res: Response) => {
    propertiesStore = structuredClone(INITIAL_PROPERTIES);
    transactionsStore = structuredClone(INITIAL_TRANSACTIONS);
    clientsStore = structuredClone(INITIAL_CLIENTS);
    agentsStore = structuredClone(INITIAL_AGENTS);
    res.json({
      properties: propertiesStore,
      transactions: transactionsStore,
      clients: clientsStore,
      agents: agentsStore,
    });
  });

  // --- Vite Middleware (Dev) or Static Dist (Prod) ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build introuvable.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ImmoLuxe server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
