import 'server-only';
import { query } from '@/lib/db';
import type { BoardProject } from '@/lib/interests';

export interface DigestMember {
  id: string;
  name: string;
  email: string;
  collegeId: string | null;
  studyYear: number | null;
  specialty: string | null;
  interests: number;
  joinedAt: string;
}

export interface DigestPreview {
  projects: BoardProject[];
  suggestions: Array<{
    id: string;
    name: string;
    domain: string;
    shortDescription: string;
    country: string;
  }>;
}

export async function listDigestMembers(): Promise<DigestMember[]> {
  const rows = await query<{
    id: string;
    name: string;
    email: string;
    college_id: string | null;
    study_year: number | null;
    specialty: string | null;
    interests: string;
    created_at: Date | string;
  }>(
    `SELECT m.id, m.name, m.email, m.college_id, m.study_year, m.specialty,
            (SELECT COUNT(*)::text FROM startup_interests i WHERE i.member_id = m.id) AS interests,
            m.created_at
     FROM members m
     WHERE m.digest_opt_in = TRUE AND m.role_type IS NOT NULL
     ORDER BY m.created_at DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    collegeId: row.college_id,
    studyYear: row.study_year === null ? null : Number(row.study_year),
    specialty: row.specialty,
    interests: Number(row.interests ?? 0),
    joinedAt: new Date(row.created_at).toISOString()
  }));
}

export async function getDigestPreview(
  memberId: string,
  projects: BoardProject[]
): Promise<DigestPreview> {
  const domains = [...new Set(projects.map((project) => project.domain))];

  if (domains.length === 0) {
    const rows = await query<{
      id: string;
      name: string;
      domain: string;
      short_description: string;
      country: string;
    }>(
      `SELECT id, name, domain, short_description, country
       FROM startups
       WHERE status = 'verified' AND is_duplicate_2025 = FALSE
       ORDER BY year_founded DESC, name ASC
       LIMIT 3`
    );
    return { projects, suggestions: rows.map(mapSuggestion) };
  }

  const rows = await query<{
    id: string;
    name: string;
    domain: string;
    short_description: string;
    country: string;
  }>(
    `SELECT id, name, domain, short_description, country
     FROM startups
     WHERE status = 'verified' AND is_duplicate_2025 = FALSE
       AND domain = ANY(string_to_array($1, ','))
       AND id NOT IN (SELECT startup_id FROM startup_interests WHERE member_id = $2)
     ORDER BY year_founded DESC, name ASC
     LIMIT 3`,
    [domains.join(','), memberId]
  );

  return { projects, suggestions: rows.map(mapSuggestion) };
}

function mapSuggestion(row: {
  id: string;
  name: string;
  domain: string;
  short_description: string;
  country: string;
}) {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    shortDescription: row.short_description ?? '',
    country: row.country
  };
}
