import 'server-only';
import { query, withTransaction, ConflictError, ForbiddenError } from '@/lib/db';

export interface MemberSession {
  id: string;
  name: string;
  email: string;
  role: 'member';
  teamDomain: null;
}

export interface MemberRow extends MemberSession {
  passwordHash: string;
  createdAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getMemberByEmail(email: string): Promise<MemberRow | null> {
  const normalized = normalizeEmail(email);
  const rows = await query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    created_at: string;
  }>(`SELECT id, name, email, password_hash, created_at FROM members WHERE email = $1`, [normalized]);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: 'member',
    teamDomain: null,
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at)
  };
}

export async function createMember(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<MemberRow> {
  try {
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO members (name, email, password_hash) VALUES ($1, $2, $3)`,
        [input.name.trim(), normalizeEmail(input.email), input.passwordHash]
      );
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      throw new ConflictError('Email already registered');
    }
    throw error;
  }
  const row = await getMemberByEmail(input.email);
  if (!row) throw new Error('Member not found after insert');
  return row;
}

export async function getSavedIds(memberId: string): Promise<string[]> {
  const rows = await query<{ startup_id: string }>(
    `SELECT startup_id FROM saved_startups WHERE member_id = $1 ORDER BY created_at DESC`,
    [memberId]
  );
  return rows.map((r) => String(r.startup_id));
}

export async function isStartupSaved(memberId: string, startupId: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM saved_startups WHERE member_id = $1 AND startup_id = $2)`,
    [memberId, startupId]
  );
  return Boolean(rows[0]?.exists);
}

export async function toggleSavedStartup(
  memberId: string,
  startupId: string
): Promise<boolean> {
  const exists = await isStartupSaved(memberId, startupId);
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO saved_startups (member_id, startup_id) VALUES ($1, $2)
       ON CONFLICT (member_id, startup_id) DO NOTHING`,
      [memberId, startupId]
    );
  });
  if (!exists) return true;
  await withTransaction(async (client) => {
    await client.query(
      `DELETE FROM saved_startups WHERE member_id = $1 AND startup_id = $2`,
      [memberId, startupId]
    );
  });
  return false;
}

export function requireMemberRole(role: string | undefined): asserts role is 'member' {
  if (role !== 'member') {
    throw new ForbiddenError('Member session required');
  }
}