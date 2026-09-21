import 'server-only';
import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { _startupIdeasDbPool?: Pool };

export const pool =
  globalForPg._startupIdeasDbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg._startupIdeasDbPool = pool;
}

export type StartupStatus = 'pending' | 'verified' | 'rejected';
export type StartupPriority = 'A' | 'B' | 'C';
export type UserRole = 'team' | 'reviewer' | 'admin';

export interface PublicStartup {
  id: string;
  name: string;
  country: string;
  domain: string;
  subDomain?: string;
  shortDescription: string;
  technology: string;
  yearFounded: number;
  officialSite?: string;
  sourceUrl?: string;
  whyRelevant: string;
  priority: StartupPriority;
  status: StartupStatus;
  refNo?: number;
  teamName?: string;
}

export interface AdminStartup extends PublicStartup {
  isDuplicate2025: boolean;
  submittedByTeam: string | null;
  submittedByTeamCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainMeta {
  slug: string;
  labelEn: string;
  labelAr: string;
  validationStatus: 'TO_CHECK' | 'IN_PROGRESS' | 'VALIDATED' | 'REJECTED';
  priorityTier: StartupPriority | null;
  startupCount: number;
}

export interface TeamRow {
  code: string;
  name: string;
  domainSlug: string;
  quota: number;
  members: number;
  submissions: number;
  progressPct: number;
}

export interface AuditEntry {
  id: number;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeData: unknown | null;
  afterData: unknown | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamDomain: string | null;
  createdAt: string;
}

export interface Actor {
  id: string;
  role: UserRole;
  teamDomain: string | null;
}

function mapPublicStartup(row: Record<string, unknown>): PublicStartup {
  return {
    id: String(row.id),
    name: String(row.name),
    country: String(row.country),
    domain: String(row.domain),
    ...(row.sub_domain ? { subDomain: String(row.sub_domain) } : {}),
    shortDescription: String(row.short_description),
    technology: String(row.technology),
    yearFounded: Number(row.year_founded),
    ...(row.official_site ? { officialSite: String(row.official_site) } : {}),
    ...(row.source_url ? { sourceUrl: String(row.source_url) } : {}),
    whyRelevant: String(row.why_relevant),
    priority: String(row.priority) as StartupPriority,
    status: String(row.status) as StartupStatus,
    ...(row.ref_no !== undefined && row.ref_no !== null
      ? { refNo: Number(row.ref_no) }
      : {})
  };
}

function mapAdminStartup(row: Record<string, unknown>): AdminStartup {
  return {
    ...mapPublicStartup(row),
    isDuplicate2025: Boolean(row.is_duplicate_2025),
    submittedByTeam: row.submitted_by_team ? String(row.submitted_by_team) : null,
    submittedByTeamCode: row.submitted_by_team_code ? String(row.submitted_by_team_code) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapAdminUser(row: Record<string, unknown>): AdminUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as UserRole,
    teamDomain: row.team_domain ? String(row.team_domain) : null,
    createdAt: String(row.created_at)
  };
}

export async function query<T = Record<string, unknown>>(
  text: string,
  values?: (string | number | boolean | null)[]
): Promise<T[]> {
  const result = await pool.query(text, values as never[]);
  return result.rows as T[];
}

export { mapPublicStartup, mapAdminStartup, mapAdminUser };

export interface Queryable {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;
}

export async function withTransaction<T>(
  callback: (client: Queryable) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}