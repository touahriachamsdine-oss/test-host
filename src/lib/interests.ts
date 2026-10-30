import 'server-only';
import { query } from '@/lib/db';

export interface InterestedMember {
  name: string;
  collegeId: string | null;
  studyYear: number | null;
}

export interface BoardProject {
  id: string;
  name: string;
  domain: string;
  shortDescription: string;
  classmates: number;
  total: number;
}

export async function getInterestIds(memberId: string): Promise<string[]> {
  const rows = await query<{ startup_id: string }>(
    `SELECT startup_id FROM startup_interests WHERE member_id = $1`,
    [memberId]
  );
  return rows.map((row) => String(row.startup_id));
}

export async function toggleInterest(memberId: string, startupId: string): Promise<boolean> {
  const removed = await query<{ startup_id: string }>(
    `DELETE FROM startup_interests WHERE member_id = $1 AND startup_id = $2 RETURNING startup_id`,
    [memberId, startupId]
  );
  if (removed.length > 0) return false;
  await query(
    `INSERT INTO startup_interests (member_id, startup_id) VALUES ($1, $2)
     ON CONFLICT (startup_id, member_id) DO NOTHING`,
    [memberId, startupId]
  );
  return true;
}

export async function countInterest(startupId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startup_interests WHERE startup_id = $1`,
    [startupId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getInterestedMembers(startupId: string, limit = 12): Promise<InterestedMember[]> {
  const rows = await query<{ name: string; college_id: string | null; study_year: number | null }>(
    `SELECT m.name, m.college_id, m.study_year
     FROM startup_interests i
     JOIN members m ON m.id = i.member_id
     WHERE i.startup_id = $1
     ORDER BY i.created_at ASC
     LIMIT $2`,
    [startupId, limit]
  );
  return rows.map((row) => ({
    name: String(row.name),
    collegeId: row.college_id ? String(row.college_id) : null,
    studyYear: row.study_year === null ? null : Number(row.study_year)
  }));
}

export async function getMemberInterests(memberId: string, limit = 24): Promise<BoardProject[]> {
  const rows = await query<{
    id: string;
    name: string;
    domain: string;
    short_description: string;
    total: string;
  }>(
    `SELECT s.id, s.name, s.domain, s.short_description,
            (SELECT COUNT(*)::text FROM startup_interests x WHERE x.startup_id = s.id) AS total
     FROM startup_interests i
     JOIN startups s ON s.id = i.startup_id
     WHERE i.member_id = $1
     ORDER BY i.created_at DESC
     LIMIT $2`,
    [memberId, limit]
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    domain: String(row.domain),
    shortDescription: String(row.short_description ?? ''),
    classmates: Number(row.total ?? 0),
    total: Number(row.total ?? 0)
  }));
}

export async function getCollegeBoard(collegeId: string, limit = 12): Promise<BoardProject[]> {
  const rows = await query<{
    id: string;
    name: string;
    domain: string;
    short_description: string;
    classmates: string;
    total: string;
  }>(
    `SELECT s.id, s.name, s.domain, s.short_description,
            COUNT(*)::text AS classmates,
            (SELECT COUNT(*)::text FROM startup_interests y WHERE y.startup_id = s.id) AS total
     FROM startup_interests i
     JOIN members m ON m.id = i.member_id
     JOIN startups s ON s.id = i.startup_id
     WHERE m.college_id = $1
     GROUP BY s.id, s.name, s.domain, s.short_description
     ORDER BY COUNT(*) DESC, s.name
     LIMIT $2`,
    [collegeId, limit]
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    domain: String(row.domain),
    shortDescription: String(row.short_description ?? ''),
    classmates: Number(row.classmates ?? 0),
    total: Number(row.total ?? 0)
  }));
}
