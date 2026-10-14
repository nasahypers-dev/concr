import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrdersTablePage } from '@/features/orders/orders-table-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('panel.nav');
  return { title: t('orders') };
}

export default function Page() {
  return <OrdersTablePage />;
}
