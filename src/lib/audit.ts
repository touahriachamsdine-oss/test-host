import 'server-only';
import { query, type Queryable } from '@/lib/db';

export async function logAudit(
  params: {
    actorId: string | null;
    action: string;
    entityType: 'startup' | 'user' | 'domain' | 'team';
    entityId: string;
    beforeData?: unknown | null;
    afterData?: unknown | null;
  },
  db?: Queryable
): Promise<void> {
  const exec = db ?? { query };
  await exec.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before_data, after_data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.actorId,
      params.action,
      params.entityType,
      params.entityId,
      params.beforeData == null ? null : JSON.stringify(params.beforeData),
      params.afterData == null ? null : JSON.stringify(params.afterData)
    ]
  );
}