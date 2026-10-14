'use client';

import { type Product, type PumpOption, SlumpClass } from '@concr/shared';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProducts, usePumps, useUpdateProduct, useUpdatePump } from '@/features/admin/use-admin';
import { useErrorMessage } from '@/features/common/use-error-message';
import { formatMoney, toMoneyString } from '@/lib/format';

const SLUMPS = Object.values(SlumpClass);

function YesNo({ value }: { value: boolean }) {
  const tc = useTranslations('common');
  return (
    <span className={value ? '' : 'text-muted-foreground'}>{value ? tc('yes') : tc('no')}</span>
  );
}

/** Spec §14 item 6: the price list. */
export function ProductsTab({ readOnly }: { readOnly: boolean }) {
  const t = useTranslations('panel.settings.products');
  const tc = useTranslations('common');
  const products = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);

  if (products.isPending) return <LoadingRows rows={5} />;
  if (products.isError || !products.data) {
    return <ErrorState error={products.error} onRetry={() => void products.refetch()} />;
  }
  return (
    <>
      <Card size="sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('grade')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>{t('slumps')}</TableHead>
                <TableHead>{t('popular')}</TableHead>
                <TableHead>{t('active')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.grade}</TableCell>
                  <TableCell>{formatMoney(product.basePrice)}</TableCell>
                  <TableCell>{product.slumpOptions.join(', ')}</TableCell>
                  <TableCell>
                    <YesNo value={product.isPopular} />
                  </TableCell>
                  <TableCell>
                    <YesNo value={product.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={readOnly}
                      onClick={() => setEditing(product)}
                    >
                      {tc('edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editing ? <ProductSheet product={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function ProductSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useTranslations('panel.settings.products');
  const tPanel = useTranslations('panel');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const update = useUpdateProduct();
  const [price, setPrice] = useState(product.basePrice);
  const [slumps, setSlumps] = useState<SlumpClass[]>(product.slumpOptions);
  const [popular, setPopular] = useState(product.isPopular);
  const [active, setActive] = useState(product.isActive);
  const priceMoney = toMoneyString(price);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!priceMoney || slumps.length === 0) return;
    update.mutate(
      {
        id: product.id,
        input: {
          basePrice: priceMoney,
          slumpOptions: slumps,
          isPopular: popular,
          isActive: active,
        },
      },
      {
        onSuccess: () => {
          toast.success(tPanel('saved'));
          onClose();
        },
      },
    );
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {t('edit')} · {product.grade}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <Field>
            <FieldLabel htmlFor="product-price">{t('price')}</FieldLabel>
            <Input
              id="product-price"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              aria-invalid={priceMoney === null ? true : undefined}
            />
          </Field>
          <Field>
            <FieldLabel>{t('slumps')}</FieldLabel>
            <div className="flex gap-4">
              {SLUMPS.map((slump) => (
                <label key={slump} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={slumps.includes(slump)}
                    onCheckedChange={(checked) =>
                      setSlumps((current) =>
                        checked === true
                          ? [...current, slump].sort()
                          : current.filter((s) => s !== slump),
                      )
                    }
                  />
                  {slump}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center justify-between text-sm">
            {t('popular')}
            <Switch checked={popular} onCheckedChange={(checked) => setPopular(checked)} />
          </label>
          <label className="flex items-center justify-between text-sm">
            {t('active')}
            <Switch checked={active} onCheckedChange={(checked) => setActive(checked)} />
          </label>
          {update.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(update.error)}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={update.isPending || priceMoney === null}>
              {tc('save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** Spec §14 item 6: pump options and their per-order prices (Q2). */
export function PumpsTab({ readOnly }: { readOnly: boolean }) {
  const t = useTranslations('panel.settings.pumps');
  const tc = useTranslations('common');
  const pumps = usePumps();
  const [editing, setEditing] = useState<PumpOption | null>(null);

  if (pumps.isPending) return <LoadingRows rows={4} />;
  if (pumps.isError || !pumps.data) {
    return <ErrorState error={pumps.error} onRetry={() => void pumps.refetch()} />;
  }
  return (
    <>
      <Card size="sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('boom')}</TableHead>
                <TableHead>{t('pricePerOrder')}</TableHead>
                <TableHead>{t('active')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pumps.data.map((pump) => (
                <TableRow key={pump.id}>
                  <TableCell className="font-medium">{pump.boomLengthM} m</TableCell>
                  <TableCell>
                    {pump.pricePerOrder ? formatMoney(pump.pricePerOrder) : t('noPrice')}
                  </TableCell>
                  <TableCell>
                    <YesNo value={pump.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={readOnly}
                      onClick={() => setEditing(pump)}
                    >
                      {tc('edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editing ? <PumpSheet pump={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function PumpSheet({ pump, onClose }: { pump: PumpOption; onClose: () => void }) {
  const t = useTranslations('panel.settings.pumps');
  const tPanel = useTranslations('panel');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const update = useUpdatePump();
  const [price, setPrice] = useState(pump.pricePerOrder ?? '');
  const [active, setActive] = useState(pump.isActive);
  const priceMoney = price.trim() === '' ? null : toMoneyString(price);
  const invalid = price.trim() !== '' && priceMoney === null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    update.mutate(
      { id: pump.id, input: { pricePerOrder: priceMoney, isActive: active } },
      {
        onSuccess: () => {
          toast.success(tPanel('saved'));
          onClose();
        },
      },
    );
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {t('edit')} · {pump.boomLengthM} m
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <Field>
            <FieldLabel htmlFor="pump-price">{t('pricePerOrder')}</FieldLabel>
            <Input
              id="pump-price"
              inputMode="decimal"
              placeholder={t('noPrice')}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              aria-invalid={invalid ? true : undefined}
            />
          </Field>
          <label className="flex items-center justify-between text-sm">
            {t('active')}
            <Switch checked={active} onCheckedChange={(checked) => setActive(checked)} />
          </label>
          {update.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(update.error)}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={update.isPending || invalid}>
              {tc('save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
