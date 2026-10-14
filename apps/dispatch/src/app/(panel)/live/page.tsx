import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LivePage } from '@/features/live/live-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('panel.nav');
  return { title: t('live') };
}

export default function Page() {
  return <LivePage />;
}
