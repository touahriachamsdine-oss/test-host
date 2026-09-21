import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/startup_ideas_dz?schema=public';
const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    const extra = [
      { name: 'Équipe MédTech', email: 'team.medtech@mpme.gov.dz', domain: 'medtech', password: 'TeamMed#2026' },
      { name: 'Équipe Drones', email: 'team.drones@mpme.gov.dz', domain: 'drones-autonomy', password: 'TeamDrone#2026' },
      { name: 'Équipe Semi-conducteurs', email: 'team.semi@mpme.gov.dz', domain: 'semiconductors', password: 'TeamSemi#2026' },
      { name: 'Équipe Nanomatériaux', email: 'team.nano@mpme.gov.dz', domain: 'nanotech-materials', password: 'TeamNano#2026' }
    ];
    for (const acc of extra) {
      const hash = await bcrypt.hash(acc.password, 12);
      await client.query(
        `INSERT INTO users (name, email, role, team_domain, password_hash)
         VALUES ($1,$2,'team',$3,$4)
         ON CONFLICT (email) DO NOTHING`,
        [acc.name, acc.email, acc.domain, hash]
      );
      console.log('user ensured:', acc.email);
    }

    const rows = await client.query(
      `SELECT id, team_domain FROM users WHERE role='team'`
    );
    const byDomain = new Map<string, string>();
    for (const r of rows.rows) {
      if (r.team_domain) byDomain.set(r.team_domain, r.id);
    }

    const orphans = await client.query(`SELECT id, domain FROM startups WHERE submitted_by_team IS NULL`);
    for (const r of orphans.rows) {
      const userId = byDomain.get(r.domain);
      if (!userId) continue;
      await client.query(`UPDATE startups SET submitted_by_team = $2 WHERE id = $1`, [r.id, userId]);
      console.log('assigned team for:', r.id);
    }
    console.log('done');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});