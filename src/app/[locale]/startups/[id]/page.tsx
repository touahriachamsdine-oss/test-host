import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyStartupPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  redirect({ href: `/startup/${id}`, locale });
}