'use client';

import type { ReportSummary } from '@concr/shared';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/state-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReport } from '@/features/admin/use-admin';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDate, formatMoney, formatVolume, todayIsoDate } from '@/lib/format';

const DEFAULT_RANGE_DAYS = 30;

/** Spec §14 item 7: orders, delivered volume and revenue for a date range, with CSV. */
export function ReportsPage() {
  const t = useTranslations('panel.reports');
  const [from, setFrom] = useState(() => todayIsoDate(new Date(), -DEFAULT_RANGE_DAYS));
  const [to, setTo] = useState(() => todayIsoDate());
  const [range, setRange] = useState({ from, to });
  const report = useReport(range);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (from && to && from <= to) setRange({ from, to });
  };

  const exportCsv = (data: ReportSummary) => {
    const rows = [
      [t('byDay'), t('orders'), t('volume'), t('revenue')],
      ...data.byDay.map((d) => [formatDate(d.date), d.orders, d.volumeM3, d.revenue]),
      [],
      [t('byProduct'), t('orders'), t('volume'), t('revenue')],
      ...data.byProduct.map((p) => [p.grade, p.orders, p.volumeM3, p.revenue]),
    ];
    downloadCsv(`concr-report-${data.from}-${data.to}.csv`, toCsv(rows));
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          report.data ? (
            <Button variant="outline" onClick={() => exportCsv(report.data)}>
              <Download className="size-4" />
              {t('exportCsv')}
            </Button>
          ) : null
        }
      />
      <form onSubmit={apply} className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {t('from')}
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('to')}
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </label>
        <Button type="submit">{t('apply')}</Button>
      </form>

      {report.isPending ? (
        <LoadingRows rows={4} />
      ) : report.isError || !report.data ? (
        <ErrorState error={report.error} onRetry={() => void report.refetch()} />
      ) : report.data.orders.total === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <ReportBody data={report.data} />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}

function ReportBody({ data }: { data: ReportSummary }) {
  const t = useTranslations('panel.reports');
  const maxRevenue = Math.max(1, ...data.byDay.map((d) => Number(d.revenue)));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label={t('orders')} value={String(data.orders.total)} />
        <Stat label={t('completed')} value={String(data.orders.completed)} />
        <Stat label={t('active')} value={String(data.orders.active)} />
        <Stat label={t('cancelled')} value={String(data.orders.cancelled + data.orders.rejected)} />
        <Stat label={t('volume')} value={formatVolume(data.volumeM3Delivered)} />
        <Stat label={t('revenue')} value={formatMoney(data.revenue)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t('byDay')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.byDay.map((day) => (
              <div
                key={day.date}
                className="grid grid-cols-[6rem_1fr_7rem] items-center gap-2 text-sm"
              >
                <span>{formatDate(day.date)}</span>
                <div className="h-3 rounded-full bg-muted">
                  <div
                    className="h-3 rounded-full bg-concr-accent"
                    style={{ width: `${(Number(day.revenue) / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-right">
                  {day.orders} · {formatMoney(day.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t('byProduct')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('byProduct')}</TableHead>
                  <TableHead className="text-right">{t('orders')}</TableHead>
                  <TableHead className="text-right">{t('volume')}</TableHead>
                  <TableHead className="text-right">{t('revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byProduct.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell className="font-medium">{row.grade}</TableCell>
                    <TableCell className="text-right">{row.orders}</TableCell>
                    <TableCell className="text-right">{formatVolume(row.volumeM3)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
