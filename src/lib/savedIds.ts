import 'server-only';
import { auth } from '@/auth';
import { getSavedIds, requireMemberRole } from '@/lib/members';

export async function getMemberSavedIdsSafe(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  try {
    requireMemberRole(session.user.role);
  } catch {
    return [];
  }
  return getSavedIds(session.user.id);
}