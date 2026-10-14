import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { InboxPage } from '@/features/inbox/inbox-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('panel.nav');
  return { title: t('inbox') };
}

export default function Page() {
  return <InboxPage />;
}
