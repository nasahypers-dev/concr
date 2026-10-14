'use client';

import { type ListDispatchOrdersQuery, OrderStatus } from '@concr/shared';
import { cn } from 'cn';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDeferredValue, useState } from 'react';
import { useApi } from '@/api/api-provider';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/state-view';
import { orderStatusTone, StatusBadge, toneClass } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrders } from '@/features/dispatch/use-dispatch';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDate, formatDateTime, formatMoney, formatWindow, todayIsoDate } from '@/lib/format';
import { orderSummary } from './order-summary';

const STATUSES = Object.values(OrderStatus);
const PAGE_SIZE = 20;
/** The mock and the API cap a page at 100 rows; the export takes the first page of that size. */
const EXPORT_LIMIT = 100;

/** Spec §14 item 5: order history with filters, search, paging and CSV. */
export function OrdersTablePage() {
  const t = useTranslations('panel.orders');
  const tStatus = useTranslations('status');
  const router = useRouter();
  const api = useApi();
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const query: ListDispatchOrdersQuery = {
    status: statuses.length > 0 ? statuses : undefined,
    date: date || undefined,
    search: deferredSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  };
  const orders = useOrders(query);
  const items = orders.data?.items ?? [];
  const total = orders.data?.total ?? 0;
  const hasFilters = statuses.length > 0 || date !== '' || search !== '';

  const toggleStatus = (status: OrderStatus) => {
    setPage(1);
    setStatuses((current) =>
      current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
    );
  };

  const clearFilters = () => {
    setStatuses([]);
    setDate('');
    setSearch('');
    setPage(1);
  };

  const exportCsv = async () => {
    const result = await api.dispatch.listOrders({ ...query, page: 1, limit: EXPORT_LIMIT });
    const header = [
      t('columns.number'),
      t('columns.created'),
      t('columns.customer'),
      t('columns.site'),
      t('columns.product'),
      t('columns.window'),
      t('columns.status'),
      t('columns.total'),
    ];
    const rows = result.items.map((o) => [
      o.number,
      formatDateTime(o.createdAt),
      o.customerName ?? '',
      o.siteName,
      orderSummary(o.productGrade, o.volumeM3, o.slump),
      `${formatDate(o.requestedDate)} ${formatWindow(o.timeWindowStart, o.timeWindowEnd)}`,
      tStatus(`order.${o.status}`),
      o.totalAmount,
    ]);
    downloadCsv(`concr-orders-${todayIsoDate()}.csv`, toCsv([header, ...rows]));
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <Button variant="outline" onClick={() => void exportCsv()}>
            <Download className="size-4" />
            {t('exportCsv')}
          </Button>
        }
      />
      <Card size="sm" className="mb-4">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              aria-label={t('search')}
              placeholder={t('search')}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="md:max-w-sm"
            />
            <Input
              aria-label={t('date')}
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
              className="md:w-44"
            />
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="md:ml-auto">
                {t('clearFilters')}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('allStatuses')}>
            {STATUSES.map((status) => {
              const active = statuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    active
                      ? toneClass[orderStatusTone[status]]
                      : 'border-border bg-background text-muted-foreground hover:bg-muted',
                    active && 'border-transparent',
                  )}
                >
                  {tStatus(`order.${status}`)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {orders.isPending ? (
        <LoadingRows rows={5} />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <Card size="sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.number')}</TableHead>
                  <TableHead>{t('columns.created')}</TableHead>
                  <TableHead>{t('columns.customer')}</TableHead>
                  <TableHead>{t('columns.site')}</TableHead>
                  <TableHead>{t('columns.product')}</TableHead>
                  <TableHead>{t('columns.window')}</TableHead>
                  <TableHead>{t('columns.trips')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="text-right">{t('columns.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.number}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{order.customerName ?? '—'}</TableCell>
                    <TableCell className="max-w-56 truncate">{order.siteName}</TableCell>
                    <TableCell>
                      {orderSummary(order.productGrade, order.volumeM3, order.slump)}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.requestedDate)}{' '}
                      {formatWindow(order.timeWindowStart, order.timeWindowEnd)}
                    </TableCell>
                    <TableCell>
                      {order.deliveriesTotal > 0
                        ? `${order.deliveriesCompleted}/${order.deliveriesTotal}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="order" status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
              <span>{t('pagination', { from, to, total })}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('prev')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={to >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
