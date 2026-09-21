import { auth } from '@/auth';
import { ForbiddenError, type Actor, type UserRole } from '@/lib/db';

export async function getActor(roles: UserRole[]): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  const authRole = session.user.role;
  if (authRole === 'member') {
    throw new ForbiddenError('Insufficient permissions');
  }
  const actor: Actor = {
    id: session.user.id,
    role: authRole,
    teamDomain: session.user.teamDomain ?? null
  };
  if (!roles.includes(actor.role)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  return actor;
}