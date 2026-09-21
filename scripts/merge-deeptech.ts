import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

interface DonorStartup {
  id: string;
  name: string;
  country: string;
  domainSlug: string;
  subDomain: string | null;
  shortDescription: string;
  technology: string;
  yearFounded: number | null;
  officialSite: string | null;
  sourceUrl: string | null;
  whyRelevant: string;
  priority: 'A' | 'B' | 'C' | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isDuplicate2025: boolean;
  submittedByTeamId: string | null;
}

interface DonorUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'ADMIN' | 'VERIFIER' | 'TEAM';
  teamId: string | null;
}

interface DonorTeam {
  id: string;
  code: string;
  domainSlug: string;
}

function loadUrl(envPath: string): string {
  const text = readFileSync(envPath, 'utf8');
  const match = text.match(/^DATABASE_URL\s*=\s*"?([^"\s]+)"?/m);
  if (!match) throw new Error(`DATABASE_URL not found in ${envPath}`);
  return match[1].trim();
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'submission';
}

const SLUG_MAP: Record<string, string> = {
  'ai-advanced-computing': 'ai-computing',
  'autonomous-systems-drones': 'drones-autonomy',
  'spacetech-aerospace': 'space-aerospace',
  'semiconductors-electronics': 'semiconductors',
  'advanced-manufacturing-3d': 'manufacturing-3d',
  'environment-clean-tech': 'cleantech',
  'cloud-computing-iot': 'cloud-iot'
};

function mapSlug(slug: string): string {
  return SLUG_MAP[slug] ?? slug;
}

const STATUS_MAP: Record<DonorStartup['status'], string> = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

async function main() {
  const targetUrl = loadUrl(resolve(process.cwd(), '.env.local'));
  const donorUrl = loadUrl(resolve(process.cwd(), '..', 'algeria-deeptech', '.env'));

  const target = new Client({ connectionString: targetUrl });
  const donor = new Client({ connectionString: donorUrl });
  await target.connect();
  await donor.connect();

  const donorTeams = (await donor.query<DonorTeam>('SELECT id, code, "domainSlug" FROM "Team"')).rows;
  const teamIdToCode = new Map(donorTeams.map((t) => [t.id, t.code]));
  const teamCodeToDomain = new Map(donorTeams.map((t) => [t.code, t.domainSlug]));

  const donorUsers = (await donor.query<DonorUser>('SELECT id, email, name, "passwordHash", role, "teamId" FROM "User"')).rows;
  const userRoleMap: Record<string, string> = { ADMIN: 'admin', VERIFIER: 'reviewer', TEAM: 'team' };

  const existingUsers = new Set(
    (await target.query('SELECT email FROM users')).rows.map((r) => String(r.email).toLowerCase())
  );
  const newUserIds = new Map<string, string>();

  for (const u of donorUsers) {
    const email = u.email.toLowerCase();
    if (existingUsers.has(email)) {
      const hit = await target.query('SELECT id FROM users WHERE email = $1', [email]);
      newUserIds.set(u.id, String(hit.rows[0].id));
      continue;
    }
    const teamCode = u.teamId ? teamIdToCode.get(u.teamId) : null;
    const teamDomain = teamCode ? mapSlug(teamCodeToDomain.get(teamCode) ?? teamCode) : null;
    const res = await target.query(
      `INSERT INTO users (name, email, role, team_domain, password_hash)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [u.name, email, userRoleMap[u.role], teamDomain, u.passwordHash]
    );
    const id = String(res.rows[0].id);
    newUserIds.set(u.id, id);
    console.log(`user: ${email} -> ${userRoleMap[u.role]}${teamDomain ? ` (${teamDomain})` : ''}`);
  }

  const existingStartupNames = new Set(
    (await target.query('SELECT name FROM startups')).rows.map((r) => String(r.name).trim().toLowerCase())
  );
  const existingStartupIds = new Set(
    (await target.query('SELECT id FROM startups')).rows.map((r) => String(r.id))
  );

  const donorStartups = (await donor.query<DonorStartup>('SELECT * FROM "Startup"')).rows;
  let inserted = 0;
  let skipped = 0;

  for (const s of donorStartups) {
    const nameKey = s.name.trim().toLowerCase();
    if (existingStartupNames.has(nameKey)) {
      skipped += 1;
      console.log(`skip (dup name): ${s.name}`);
      continue;
    }
    let id = slugify(s.name);
    if (existingStartupIds.has(id)) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const teamCode = s.submittedByTeamId ? teamIdToCode.get(s.submittedByTeamId) ?? null : null;
    await target.query(
      `INSERT INTO startups (
         id, name, country, domain, sub_domain, short_description, technology,
         year_founded, official_site, source_url, why_relevant, priority, status,
         is_duplicate_2025, submitted_by_team, submitted_by_team_code
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id,
        s.name,
        s.country,
        mapSlug(s.domainSlug),
        s.subDomain ?? null,
        s.shortDescription,
        s.technology,
        s.yearFounded,
        s.officialSite ?? null,
        s.sourceUrl ?? null,
        s.whyRelevant,
        s.priority ?? 'C',
        STATUS_MAP[s.status],
        s.isDuplicate2025,
        s.submittedByTeamId ? newUserIds.get(s.submittedByTeamId) ?? null : null,
        teamCode
      ]
    );
    existingStartupNames.add(nameKey);
    existingStartupIds.add(id);
    inserted += 1;
    console.log(`import: ${s.name} -> ${mapSlug(s.domainSlug)} (${s.status.toLowerCase()}${teamCode ? ` / ${teamCode}` : ''})`);
  }

  console.log(`\nusers imported: ${newUserIds.size - 0} checked, startups imported: ${inserted}, duplicates skipped: ${skipped}`);

  const totals = await target.query<{ status: string; count: string }>(
    'SELECT status, COUNT(*)::text AS count FROM startups GROUP BY status ORDER BY status'
  );
  console.log('target totals:', totals.rows.map((r) => `${r.status}=${r.count}`).join(', '));
  const verifedByDomain = await target.query<{ domain: string; count: string }>(
    "SELECT domain, COUNT(*)::text AS count FROM startups WHERE status='verified' GROUP BY domain ORDER BY domain"
  );
  console.log('verified by domain:', verifedByDomain.rows.map((r) => `${r.domain}:${r.count}`).join(' '));

  await donor.end();
  await target.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});