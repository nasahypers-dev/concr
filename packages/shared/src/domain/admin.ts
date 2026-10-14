import type { Id, IsoDate, MoneyString } from './common';
import type { ServiceArea, Supplier } from './supplier';
import type { Truck } from './truck';
import type { Driver } from './user';

/** Driver as the admin's Drivers page shows it (D22): account state and the mixer resolved. */
export interface AdminDriver extends Driver {
  isActive: boolean;
  truck: Truck | null;
}

export interface AdminSettings {
  supplier: Supplier;
  serviceArea: ServiceArea;
}

export interface ReportDayRow {
  date: IsoDate;
  /** Orders requested for that day, any status. */
  orders: number;
  /** m³ of completed trips. */
  volumeM3: number;
  /** Totals of COMPLETED orders. */
  revenue: MoneyString;
}

export interface ReportProductRow {
  productId: Id;
  grade: string;
  orders: number;
  volumeM3: number;
  revenue: MoneyString;
}

/** GET /admin/reports/summary?from&to (spec §14 item 7). */
export interface ReportSummary {
  from: IsoDate;
  to: IsoDate;
  orders: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    rejected: number;
  };
  volumeM3Delivered: number;
  revenue: MoneyString;
  byDay: ReportDayRow[];
  byProduct: ReportProductRow[];
}
