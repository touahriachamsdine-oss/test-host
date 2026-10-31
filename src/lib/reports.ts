import 'server-only';
import { query } from '@/lib/db';

export type ReportReason = 'wrong_info' | 'translation' | 'broken_link' | 'duplicate' | 'other';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface ReportRow {
  id: number;
  startupId: string;
  startupName: string;
  reason: ReportReason;
  note: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
}

export async function startupExists(startupId: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM startups WHERE id = $1) AS exists`,
    [startupId]
  );
  return Boolean(rows[0]?.exists);
}

export async function createReport(input: {
  startupId: string;
  memberId: string | null;
  reason: ReportReason;
  note: string | null;
}): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO startup_reports (startup_id, member_id, reason, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.startupId, input.memberId, input.reason, input.note?.trim() || null]
  );
  return Number(rows[0]?.id ?? 0);
}

export async function countReportsByStartup(startupId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startup_reports WHERE startup_id = $1 AND status = 'open'`,
    [startupId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function countOpenReports(): Promise<number> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startup_reports WHERE status = 'open'`
  );
  return Number(rows[0]?.count ?? 0);
}

export async function listReports(status: ReportStatus | 'all' = 'open', limit = 200): Promise<ReportRow[]> {
  const rows = await query<{
    id: string;
    startup_id: string;
    startup_name: string | null;
    reason: ReportReason;
    note: string | null;
    status: ReportStatus;
    created_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    reporter_name: string | null;
    reporter_email: string | null;
  }>(
    `SELECT r.id, r.startup_id, s.name AS startup_name, r.reason, r.note, r.status,
            r.created_at, r.resolved_at, r.resolved_by,
            m.name AS reporter_name, m.email AS reporter_email
     FROM startup_reports r
     LEFT JOIN startups s ON s.id = r.startup_id
     LEFT JOIN members m ON m.id = r.member_id
     WHERE ($1 = 'all' OR r.status = $1)
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [status, limit]
  );
  return rows.map((row) => ({
    id: Number(row.id),
    startupId: String(row.startup_id),
    startupName: row.startup_name ? String(row.startup_name) : String(row.startup_id),
    reason: row.reason,
    note: row.note ? String(row.note) : null,
    status: row.status,
    createdAt: String(row.created_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    resolvedBy: row.resolved_by ? String(row.resolved_by) : null,
    reporterName: row.reporter_name ? String(row.reporter_name) : null,
    reporterEmail: row.reporter_email ? String(row.reporter_email) : null
  }));
}

export async function setReportStatus(
  id: number,
  status: Exclude<ReportStatus, 'open'> | 'open',
  actor: string
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE startup_reports
     SET status = $2,
         resolved_at = CASE WHEN $2 = 'open' THEN NULL ELSE now() END,
         resolved_by = CASE WHEN $2 = 'open' THEN NULL ELSE $3 END
     WHERE id = $1
     RETURNING id`,
    [id, status, actor]
  );
  return rows.length > 0;
}
