import 'server-only';
import {
  query,
  withTransaction,
  ForbiddenError,
  mapAdminStartup,
  mapAdminUser,
  type Actor,
  type AdminStartup,
  type AdminUser,
  type AuditEntry,
  type UserRole,
  type DomainMeta,
  type TeamRow
} from '@/lib/db';
import { logAudit } from '@/lib/audit';

function assertRole(actor: Actor, roles: UserRole[]): void {
  if (!roles.includes(actor.role)) {
    throw new ForbiddenError();
  }
}

export async function getUserByEmail(email: string): Promise<(AdminUser & { passwordHash: string }) | null> {
  const rows = await query(
    `SELECT id, name, email, role, team_domain, password_hash, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as UserRole,
    teamDomain: row.team_domain ? String(row.team_domain) : null,
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at)
  };
}

export async function getStartupForAdminById(id: string): Promise<AdminStartup | null> {
  const rows = await query(
    `SELECT id, name, country, domain, sub_domain, short_description, technology,
            year_founded, official_site, source_url, why_relevant, priority, status,
            is_duplicate_2025, submitted_by_team, submitted_by_team_code, created_at, updated_at
     FROM startups WHERE id = $1`,
    [id]
  );
  return rows.length ? mapAdminStartup(rows[0]) : null;
}

export async function listStartupsForAdmin(status?: string): Promise<AdminStartup[]> {
  const rows = status
    ? await query(
        `SELECT id, name, country, domain, sub_domain, short_description, technology,
                year_founded, official_site, source_url, why_relevant, priority, status,
                is_duplicate_2025, submitted_by_team, submitted_by_team_code, created_at, updated_at
         FROM startups WHERE status = $1 ORDER BY created_at DESC`,
        [status]
      )
    : await query(
        `SELECT id, name, country, domain, sub_domain, short_description, technology,
                year_founded, official_site, source_url, why_relevant, priority, status,
                is_duplicate_2025, submitted_by_team, submitted_by_team_code, created_at, updated_at
         FROM startups ORDER BY created_at DESC`
      );
  return rows.map(mapAdminStartup);
}

export async function listMineForAdmin(actorId: string): Promise<AdminStartup[]> {
  const rows = await query(
    `SELECT id, name, country, domain, sub_domain, short_description, technology,
            year_founded, official_site, source_url, why_relevant, priority, status,
            is_duplicate_2025, submitted_by_team, submitted_by_team_code, created_at, updated_at
     FROM startups WHERE submitted_by_team = $1 ORDER BY created_at DESC`,
    [actorId]
  );
  return rows.map(mapAdminStartup);
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'submission';
}

export async function createStartup(actor: Actor, input: {
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
  priority: 'A' | 'B' | 'C';
}): Promise<AdminStartup> {
  if (actor.role === 'team' && actor.teamDomain && input.domain !== actor.teamDomain) {
    throw new ForbiddenError(
      `Team members can only submit in their own domain (${actor.teamDomain}).`
    );
  }

  const id = slugify(input.name);

  const teamRows = await query<{ code: string }>(
    `SELECT code FROM teams WHERE domain_slug = $1`,
    [input.domain]
  );
  const teamCode = teamRows.length ? String(teamRows[0].code) : null;

  await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO startups (
         id, name, country, domain, sub_domain, short_description, technology,
         year_founded, official_site, source_url, why_relevant, priority, status,
         is_duplicate_2025, submitted_by_team, submitted_by_team_code
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',FALSE,$13,$14)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, updated_at = now()`,
      [
        id,
        input.name,
        input.country,
        input.domain,
        input.subDomain ?? null,
        input.shortDescription,
        input.technology,
        input.yearFounded,
        input.officialSite ?? null,
        input.sourceUrl ?? null,
        input.whyRelevant,
        input.priority,
        actor.id,
        teamCode
      ]
    );
    void inserted;
    await logAudit({
      actorId: actor.id,
      action: 'create',
      entityType: 'startup',
      entityId: id,
      afterData: { name: input.name, domain: input.domain }
    }, client);
  });

  const created = await getStartupForAdminById(id);
  if (!created) throw new Error('Failed to create startup');
  return created;
}

export async function updateStartup(
  actor: Actor,
  id: string,
  input: {
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
    priority: 'A' | 'B' | 'C';
  }
): Promise<AdminStartup> {
  const current = await getStartupForAdminById(id);
  if (!current) throw new Error('Startup not found');

  if (actor.role === 'team') {
    if (current.submittedByTeam !== actor.id) {
      throw new ForbiddenError('Team members can only edit their own submissions.');
    }
    if (actor.teamDomain && input.domain !== actor.teamDomain) {
      throw new ForbiddenError(
        `Team members can only submit in their own domain (${actor.teamDomain}).`
      );
    }
  }

  const beforeData = {
    name: current.name,
    country: current.country,
    domain: current.domain,
    subDomain: current.subDomain ?? null,
    shortDescription: current.shortDescription,
    technology: current.technology,
    yearFounded: current.yearFounded,
    officialSite: current.officialSite ?? null,
    sourceUrl: current.sourceUrl ?? null,
    whyRelevant: current.whyRelevant,
    priority: current.priority
  };
  const afterData = {
    name: input.name,
    country: input.country,
    domain: input.domain,
    subDomain: input.subDomain ?? null,
    shortDescription: input.shortDescription,
    technology: input.technology,
    yearFounded: input.yearFounded,
    officialSite: input.officialSite ?? null,
    sourceUrl: input.sourceUrl ?? null,
    whyRelevant: input.whyRelevant,
    priority: input.priority
  };

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE startups SET
         name = $2, country = $3, domain = $4, sub_domain = $5, short_description = $6,
         technology = $7, year_founded = $8, official_site = $9, source_url = $10,
         why_relevant = $11, priority = $12, updated_at = now()
       WHERE id = $1`,
      [
        id,
        input.name,
        input.country,
        input.domain,
        input.subDomain ?? null,
        input.shortDescription,
        input.technology,
        input.yearFounded,
        input.officialSite ?? null,
        input.sourceUrl ?? null,
        input.whyRelevant,
        input.priority
      ]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'edit',
      entityType: 'startup',
      entityId: id,
      beforeData,
      afterData
    }, client);
  });

  const updated = await getStartupForAdminById(id);
  if (!updated) throw new Error('Startup not found');
  return updated;
}

export async function updateStartupStatus(
  actor: Actor,
  id: string,
  status: 'pending' | 'verified' | 'rejected'
): Promise<AdminStartup> {
  assertRole(actor, ['reviewer', 'admin']);
  const current = await getStartupForAdminById(id);
  if (!current) throw new Error('Startup not found');
  if (current.status === status) return current;

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE startups SET status = $2, updated_at = now() WHERE id = $1`,
      [id, status]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'status_change',
      entityType: 'startup',
      entityId: id,
      beforeData: { status: current.status },
      afterData: { status }
    }, client);
  });

  const updated = await getStartupForAdminById(id);
  if (!updated) throw new Error('Startup not found');
  return updated;
}

export async function updateStartupPriority(
  actor: Actor,
  id: string,
  priority: 'A' | 'B' | 'C'
): Promise<AdminStartup> {
  assertRole(actor, ['reviewer', 'admin']);
  const current = await getStartupForAdminById(id);
  if (!current) throw new Error('Startup not found');
  if (current.priority === priority) return current;

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE startups SET priority = $2, updated_at = now() WHERE id = $1`,
      [id, priority]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'priority_change',
      entityType: 'startup',
      entityId: id,
      beforeData: { priority: current.priority },
      afterData: { priority }
    }, client);
  });

  const updated = await getStartupForAdminById(id);
  if (!updated) throw new Error('Startup not found');
  return updated;
}

export async function setDuplicateFlag(
  actor: Actor,
  id: string,
  isDuplicate2025: boolean
): Promise<AdminStartup> {
  assertRole(actor, ['reviewer', 'admin']);
  const current = await getStartupForAdminById(id);
  if (!current) throw new Error('Startup not found');
  if (current.isDuplicate2025 === isDuplicate2025) return current;

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE startups SET is_duplicate_2025 = $2, updated_at = now() WHERE id = $1`,
      [id, isDuplicate2025]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'duplicate_flag',
      entityType: 'startup',
      entityId: id,
      beforeData: { isDuplicate2025: current.isDuplicate2025 },
      afterData: { isDuplicate2025 }
    }, client);
  });

  const updated = await getStartupForAdminById(id);
  if (!updated) throw new Error('Startup not found');
  return updated;
}

export async function listUsers(actor: Actor): Promise<AdminUser[]> {
  assertRole(actor, ['admin']);
  const rows = await query(
    `SELECT id, name, email, role, team_domain, created_at
     FROM users ORDER BY created_at ASC`
  );
  return rows.map(mapAdminUser);
}

export async function createUser(actor: Actor, input: {
  name: string;
  email: string;
  role: UserRole;
  teamDomain?: string | null;
  passwordHash: string;
}): Promise<AdminUser> {
  assertRole(actor, ['admin']);

  await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO users (name, email, role, team_domain, password_hash)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [input.name, input.email, input.role, input.teamDomain ?? null, input.passwordHash]
    );
    const newId = String((inserted.rows[0] as { id: unknown }).id);
    await logAudit({
      actorId: actor.id,
      action: 'create',
      entityType: 'user',
      entityId: newId,
      afterData: { name: input.name, email: input.email, role: input.role, teamDomain: input.teamDomain ?? null }
    }, client);
  });

  const created = await listUsers(actor);
  return created[created.length - 1];
}

export async function updateUserRole(
  actor: Actor,
  userId: string,
  role: UserRole,
  teamDomain?: string | null
): Promise<AdminUser> {
  assertRole(actor, ['admin']);
  const rows = await query(
    `SELECT id, name, email, role, team_domain, created_at FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows.length) throw new Error('User not found');
  const current = mapAdminUser(rows[0]);

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE users SET role = $2, team_domain = $3 WHERE id = $1`,
      [userId, role, teamDomain ?? null]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'role_change',
      entityType: 'user',
      entityId: userId,
      beforeData: { role: current.role, teamDomain: current.teamDomain },
      afterData: { role, teamDomain: teamDomain ?? null }
    }, client);
  });

  const rowsAfter = await query(
    `SELECT id, name, email, role, team_domain, created_at FROM users WHERE id = $1`,
    [userId]
  );
  return mapAdminUser(rowsAfter[0]);
}

export async function listAuditLog(actor: Actor, limit = 200): Promise<AuditEntry[]> {
  assertRole(actor, ['admin']);
  const rows = await query(
    `SELECT a.id, a.user_id, u.name AS actor_name, a.action, a.entity_type, a.entity_id,
            a.before_data, a.after_data, a.created_at
     FROM audit_log a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((row) => ({
    id: Number(row.id),
    actorId: row.user_id ? String(row.user_id) : null,
    actorName: row.actor_name ? String(row.actor_name) : null,
    action: String(row.action),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    beforeData: row.before_data ?? null,
    afterData: row.after_data ?? null,
    createdAt: String(row.created_at)
  }));
}

export async function listDomainsMetaForAdmin(actor: Actor): Promise<DomainMeta[]> {
  assertRole(actor, ['reviewer', 'admin']);
  const rows = await query<{
    slug: string;
    label_en: string;
    label_ar: string;
    validation_status: string;
    priority_tier: string | null;
    startup_count: string;
  }>(
    `SELECT dm.slug, dm.label_en, dm.label_ar, dm.validation_status, dm.priority_tier,
            (SELECT COUNT(*) FROM startups s WHERE s.domain = dm.slug)::text AS startup_count
     FROM domain_meta dm ORDER BY dm.label_en ASC`
  );
  return rows.map((r) => ({
    slug: String(r.slug),
    labelEn: String(r.label_en),
    labelAr: String(r.label_ar),
    validationStatus: String(r.validation_status) as DomainMeta['validationStatus'],
    priorityTier: r.priority_tier ? (String(r.priority_tier) as 'A' | 'B' | 'C') : null,
    startupCount: Number(r.startup_count)
  }));
}

export async function setDomainMeta(
  actor: Actor,
  slug: string,
  input: { validationStatus: string; priorityTier: 'A' | 'B' | 'C' | null }
): Promise<DomainMeta> {
  assertRole(actor, ['reviewer', 'admin']);
  const rows = await query(
    `SELECT slug, label_en, label_ar, validation_status, priority_tier FROM domain_meta WHERE slug = $1`,
    [slug]
  );
  if (!rows.length) throw new Error('Domain not found');
  const current = rows[0];

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE domain_meta SET validation_status = $2, priority_tier = $3, updated_at = now()
       WHERE slug = $1`,
      [slug, input.validationStatus, input.priorityTier]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'domain_change',
      entityType: 'domain',
      entityId: slug,
      beforeData: { validationStatus: String(current.validation_status), priorityTier: current.priority_tier ?? null },
      afterData: input
    }, client);
  });

  const after = await query(
    `SELECT dm.slug, dm.label_en, dm.label_ar, dm.validation_status, dm.priority_tier,
            (SELECT COUNT(*) FROM startups s WHERE s.domain = dm.slug)::text AS startup_count
     FROM domain_meta dm WHERE dm.slug = $1`,
    [slug]
  );
  return {
    slug: String(after[0].slug),
    labelEn: String(after[0].label_en),
    labelAr: String(after[0].label_ar),
    validationStatus: String(after[0].validation_status) as DomainMeta['validationStatus'],
    priorityTier: after[0].priority_tier ? (String(after[0].priority_tier) as 'A' | 'B' | 'C') : null,
    startupCount: Number(after[0].startup_count)
  };
}

export async function listTeamsForAdmin(actor: Actor): Promise<TeamRow[]> {
  assertRole(actor, ['reviewer', 'admin']);
  const rows = await query<{
    code: string;
    name: string;
    domain_slug: string;
    quota: string;
    members: string;
    submissions: string;
  }>(
    `SELECT t.code, t.name, t.domain_slug, t.quota::text,
            (SELECT COUNT(*) FROM users u WHERE u.team_domain = t.domain_slug)::text AS members,
            (SELECT COUNT(*) FROM startups s WHERE s.submitted_by_team_code = t.code)::text AS submissions
     FROM teams t ORDER BY t.code ASC`
  );
  return rows.map((r) => {
    const quota = Number(r.quota);
    const submissions = Number(r.submissions);
    return {
      code: String(r.code),
      name: String(r.name),
      domainSlug: String(r.domain_slug),
      quota,
      members: Number(r.members),
      submissions,
      progressPct: quota > 0 ? Math.round((submissions / quota) * 100) : 0
    };
  });
}

export async function setTeamQuota(
  actor: Actor,
  code: string,
  quota: number
): Promise<TeamRow> {
  assertRole(actor, ['admin']);
  const rows = await query(
    `SELECT code, name, domain_slug, quota FROM teams WHERE code = $1`,
    [code]
  );
  if (!rows.length) throw new Error('Team not found');
  const before = Number(rows[0].quota);

  await withTransaction(async (client) => {
    void (await client.query(
      `UPDATE teams SET quota = $2, updated_at = now() WHERE code = $1`,
      [code, quota]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'quota_change',
      entityType: 'team',
      entityId: code,
      beforeData: { quota: before },
      afterData: { quota }
    }, client);
  });

  const teams = await listTeamsForAdmin(actor);
  const updated = teams.find((t) => t.code === code);
  if (!updated) throw new Error('Team not found');
  return updated;
}

export async function getDashboardStats(actor: Actor): Promise<{
  totals: { total: number; proposed: number; validated: number; rejected: number; duplicates: number; progressPct: number };
  byDomain: { domain: string; total: number; validated: number; pending: number; rejected: number; duplicates: number }[];
  byStatus: { status: string; count: number }[];
  byTeam: { userId: string | null; userEmail: string | null; teamDomain: string | null; total: number; validated: number; pending: number }[];
  teamsQuotas: TeamRow[];
}> {
  assertRole(actor, ['admin']);

  const totalRows = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM startups`);
  const total = Number(totalRows[0].count);

  const statusRows = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count FROM startups GROUP BY status`
  );
  const byStatus = statusRows.map((r) => ({ status: r.status, count: Number(r.count) }));
  const proposed = byStatus.find((s) => s.status === 'pending')?.count ?? 0;
  const validated = byStatus.find((s) => s.status === 'verified')?.count ?? 0;
  const rejected = byStatus.find((s) => s.status === 'rejected')?.count ?? 0;

  const dupRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startups WHERE is_duplicate_2025 = TRUE`
  );
  const duplicates = Number(dupRows[0].count);
  const progressPct = total > 0 ? Math.round((validated / total) * 100) : 0;

  const domainRows = await query<{
    domain: string;
    total: string;
    validated: string;
    pending: string;
    rejected: string;
    duplicates: string;
  }>(
    `SELECT domain,
            COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE status='verified')::text AS validated,
            COUNT(*) FILTER (WHERE status='pending')::text AS pending,
            COUNT(*) FILTER (WHERE status='rejected')::text AS rejected,
            COUNT(*) FILTER (WHERE is_duplicate_2025=TRUE)::text AS duplicates
     FROM startups GROUP BY domain ORDER BY domain`
  );
  const byDomain = domainRows.map((r) => ({
    domain: r.domain,
    total: Number(r.total),
    validated: Number(r.validated),
    pending: Number(r.pending),
    rejected: Number(r.rejected),
    duplicates: Number(r.duplicates)
  }));

  const teamRows = await query<{
    userId: string | null;
    userEmail: string | null;
    teamDomain: string | null;
    total: string;
    validated: string;
    pending: string;
  }>(
    `SELECT s.submitted_by_team AS "userId", u.email AS "userEmail", u.team_domain AS "teamDomain",
            COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE s.status='verified')::text AS validated,
            COUNT(*) FILTER (WHERE s.status='pending')::text AS pending
     FROM startups s
     LEFT JOIN users u ON u.id = s.submitted_by_team
     GROUP BY s.submitted_by_team, u.email, u.team_domain
     ORDER BY total DESC`
  );
  const byTeam = teamRows.map((r) => ({
    userId: r.userId,
    userEmail: r.userEmail,
    teamDomain: r.teamDomain,
    total: Number(r.total),
    validated: Number(r.validated),
    pending: Number(r.pending)
  }));

  return {
    totals: { total, proposed, validated, rejected, duplicates, progressPct },
    byDomain,
    byStatus,
    byTeam,
    teamsQuotas: await listTeamsForAdmin(actor)
  };
}