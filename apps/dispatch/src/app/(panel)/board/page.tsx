import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BoardPage } from '@/features/board/board-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('panel.nav');
  return { title: t('board') };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { date } = await searchParams;
  return <BoardPage initialDate={typeof date === 'string' ? date : undefined} />;
}
