import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/features/settings/settings-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('panel.nav');
  return { title: t('settings') };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  return <SettingsPage initialTab={typeof tab === 'string' ? tab : undefined} />;
}
