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
import { downloadPdf, tablePdfDefinition } from '@/lib/pdf';
import {
  formatDate,
  formatMoney,
  formatVolume,
  previousMonthRange,
  startOfMonthIso,
  startOfWeekIso,
  todayIsoDate,
} from '@/lib/format';

const DEFAULT_RANGE_DAYS = 30;

type PresetKey = 'today' | 'week' | 'month' | 'lastMonth' | 'last30';
const PRESETS: readonly PresetKey[] = ['today', 'week', 'month', 'lastMonth', 'last30'];

/** Baku calendar ranges behind the quick buttons. */
function presetRange(key: PresetKey, now = new Date()): { from: string; to: string } {
  const today = todayIsoDate(now);
  switch (key) {
    case 'today':
      return { from: today, to: today };
    case 'week':
      return { from: startOfWeekIso(now), to: today };
    case 'month':
      return { from: startOfMonthIso(now), to: today };
    case 'lastMonth':
      return previousMonthRange(now);
    default:
      return { from: todayIsoDate(now, -DEFAULT_RANGE_DAYS), to: today };
  }
}

/** Spec §14 item 7: orders, delivered volume and revenue for a date range, with a PDF export. */
export function ReportsPage() {
  const t = useTranslations('panel.reports');
  const [from, setFrom] = useState(() => todayIsoDate(new Date(), -DEFAULT_RANGE_DAYS));
  const [to, setTo] = useState(() => todayIsoDate());
  const [range, setRange] = useState({ from, to });
  const report = useReport(range);
  const invalid = !from || !to || from > to;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (!invalid) setRange({ from, to });
  };

  // The start can never pass the end: picking one side drags the other along (owner, 2026-10-15).
  const changeFrom = (value: string) => {
    setFrom(value);
    if (value && to && value > to) setTo(value);
  };
  const changeTo = (value: string) => {
    setTo(value);
    if (value && from && value < from) setFrom(value);
  };
  const applyPreset = (key: PresetKey) => {
    const next = presetRange(key);
    setFrom(next.from);
    setTo(next.to);
    setRange(next);
  };

  const exportPdf = async (data: ReportSummary) => {
    const period = `${formatDate(data.from)} – ${formatDate(data.to)}`;
    await downloadPdf(
      `concr-report-${data.from}-${data.to}.pdf`,
      tablePdfDefinition({
        title: t('title'),
        subtitle: `${t('subtitle')} · ${period}`,
        footer: 'CONCR',
        tables: [
          {
            columns: [
              t('orders'),
              t('completed'),
              t('active'),
              t('cancelled'),
              t('volume'),
              t('revenue'),
            ],
            rows: [
              [
                data.orders.total,
                data.orders.completed,
                data.orders.active,
                data.orders.cancelled + data.orders.rejected,
                formatVolume(data.volumeM3Delivered),
                formatMoney(data.revenue),
              ],
            ],
          },
          {
            title: t('byDay'),
            columns: [t('from'), t('orders'), t('volume'), t('revenue')],
            rows: data.byDay.map((d) => [
              formatDate(d.date),
              d.orders,
              formatVolume(d.volumeM3),
              formatMoney(d.revenue),
            ]),
            widths: ['auto', 'auto', '*', '*'],
          },
          {
            title: t('byProduct'),
            columns: [t('byProduct'), t('orders'), t('volume'), t('revenue')],
            rows: data.byProduct.map((p) => [
              p.grade,
              p.orders,
              formatVolume(p.volumeM3),
              formatMoney(p.revenue),
            ]),
            widths: ['auto', 'auto', '*', '*'],
          },
        ],
      }),
    );
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={`${t('subtitle')} · ${formatDate(range.from)} – ${formatDate(range.to)}`}
        actions={
          report.data ? (
            <Button variant="outline" onClick={() => void exportPdf(report.data)}>
              <Download className="size-4" />
              {t('exportPdf')}
            </Button>
          ) : null
        }
      />
      <form onSubmit={apply} className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            {t('from')}
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => changeFrom(e.target.value)}
              className="w-44"
              aria-invalid={invalid ? true : undefined}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('to')}
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => changeTo(e.target.value)}
              className="w-44"
              aria-invalid={invalid ? true : undefined}
            />
          </label>
          <Button type="submit" disabled={invalid}>
            {t('apply')}
          </Button>
          {invalid ? <span className="text-sm text-destructive">{t('invalidRange')}</span> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((key) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(key)}
            >
              {t(`presets.${key}`)}
            </Button>
          ))}
        </div>
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
