import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminIndexPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  if (session.user.role === 'admin') redirect('/admin/dashboard');
  if (session.user.role === 'reviewer') redirect('/admin/review');
  redirect('/admin/submit');
}