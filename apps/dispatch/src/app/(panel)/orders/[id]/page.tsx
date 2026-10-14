import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrderDetailPage } from '@/features/orders/order-detail-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('panel.nav');
  return { title: t('orders') };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailPage id={id} />;
}
