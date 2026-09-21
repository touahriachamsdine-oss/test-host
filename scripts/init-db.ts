import pg from 'pg';
import bcrypt from 'bcryptjs';
import { STARTUPS } from '../src/data/startups.ts';

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/startup_ideas_dz?schema=public';

const pool = new Pool({ connectionString: DATABASE_URL });

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('team','reviewer','admin')),
  team_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS startups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  domain TEXT NOT NULL,
  sub_domain TEXT,
  short_description TEXT NOT NULL,
  technology TEXT NOT NULL,
  year_founded INT NOT NULL,
  official_site TEXT,
  source_url TEXT,
  why_relevant TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('A','B','C')),
  status TEXT NOT NULL CHECK (status IN ('pending','verified','rejected')),
  is_duplicate_2025 BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_by_team UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_startups_status ON startups(status);
CREATE INDEX IF NOT EXISTS idx_startups_domain ON startups(domain);
CREATE INDEX IF NOT EXISTS idx_startups_submitted_by ON startups(submitted_by_team);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
`;

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SCHEMA);

    const userCount = await client.query('SELECT COUNT(*)::int AS n FROM users');
    if (Number(userCount.rows[0].n) > 0) {
      console.log('users already seeded, skipping accounts');
    } else {
      const accounts = [
        { name: 'Gouvernement Admin', email: 'admin@mpme.gov.dz', role: 'admin', teamDomain: null, password: 'Admin#2026' },
        { name: 'Comité de Revue', email: 'reviewer@mpme.gov.dz', role: 'reviewer', teamDomain: null, password: 'Reviewer#2026' },
        { name: 'Équipe IA & Computing', email: 'team.ai@mpme.gov.dz', role: 'team', teamDomain: 'ai-computing', password: 'TeamIA#2026' },
        { name: 'Équipe Énergie', email: 'team.energy@mpme.gov.dz', role: 'team', teamDomain: 'energy-storage', password: 'TeamEnergy#2026' },
        { name: 'Équipe Cyber', email: 'team.cyber@mpme.gov.dz', role: 'team', teamDomain: 'cybersecurity', password: 'TeamCyber#2026' },
        { name: 'Équipe Biotech', email: 'team.biotech@mpme.gov.dz', role: 'team', teamDomain: 'biotech-healthtech', password: 'TeamBio#2026' },
        { name: 'Équipe Spatiale', email: 'team.space@mpme.gov.dz', role: 'team', teamDomain: 'space-aerospace', password: 'TeamSpace#2026' },
        { name: 'Équipe Robotique', email: 'team.robotics@mpme.gov.dz', role: 'team', teamDomain: 'robotics', password: 'TeamRobo#2026' }
      ];

      for (const acc of accounts) {
        const hash = await bcrypt.hash(acc.password, 12);
        await client.query(
          `INSERT INTO users (name, email, role, team_domain, password_hash)
           VALUES ($1,$2,$3,$4,$5)`,
          [acc.name, acc.email, acc.role, acc.teamDomain, hash]
        );
        console.log(`user created: ${acc.email} (${acc.role})`);
      }
    }

    const teamRows = await client.query<{ team_domain: string; id: string }>(
      `SELECT team_domain, id FROM users WHERE role = 'team'`
    );
    const teamByDomain = new Map<string, string>();
    for (const row of teamRows.rows) {
      if (row.team_domain) teamByDomain.set(row.team_domain, row.id);
    }

    const startupCount = await client.query('SELECT COUNT(*)::int AS n FROM startups');
    if (Number(startupCount.rows[0].n) > 0) {
      console.log('startups already seeded, skipping rows');
    } else {
      for (const s of STARTUPS) {
        const submitter = teamByDomain.get(s.domain) ?? null;
        await client.query(
          `INSERT INTO startups (
             id, name, country, domain, sub_domain, short_description, technology,
             year_founded, official_site, source_url, why_relevant, priority, status,
             is_duplicate_2025, submitted_by_team
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,FALSE,$14)`,
          [
            s.id, s.name, s.country, s.domain, s.subDomain ?? null, s.shortDescription,
            s.technology, s.yearFounded, s.officialSite ?? null, s.sourceUrl ?? null,
            s.whyRelevant, s.priority, s.status, submitter
          ]
        );
        await client.query(
          `INSERT INTO audit_log (user_id, action, entity_type, entity_id, after_data)
           VALUES ($1, 'seed', 'startup', $2, $3)`,
          [submitter, s.id, JSON.stringify({ name: s.name, status: s.status })]
        );
        console.log(`startup seeded: ${s.id} (${s.status})`);
      }
    }

    await client.query('COMMIT');
    console.log('init-db complete');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});