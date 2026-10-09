import type { Site } from '../domain/site';
import type { CustomerAccount, User } from '../domain/user';
import { CustomerType, UserRole } from '../enums';

export const CUSTOMER_IDS = {
  orxan: 'cust_1',
  tikintiMmc: 'cust_2',
} as const;

export const SITE_IDS = {
  yasamal: 'site_1',
  xirdalan: 'site_2',
  mardakan: 'site_3',
  binagadi: 'site_4',
} as const;

export const STAFF = {
  dispatcher: {
    id: 'staff_dispatcher',
    email: 'dispatcher@novxanibeton.az',
    password: 'Dispatcher123!', // dev only (spec §18)
    fullName: 'Dispetçer',
    role: UserRole.DISPATCHER,
  },
  admin: {
    id: 'staff_admin',
    email: 'admin@novxanibeton.az',
    password: 'Admin123!', // dev only placeholder (spec names the account, not the password)
    fullName: 'Admin',
    role: UserRole.SUPPLIER_ADMIN,
  },
} as const;

/** Two customers (spec §18). TODO(nurlan): placeholder names, phones and VÖEN. */
export function createCustomers(now: Date): CustomerAccount[] {
  const createdAt = new Date(now.getTime() - 60 * 86_400_000).toISOString();
  return [
    {
      id: CUSTOMER_IDS.orxan,
      phone: '+994500000001',
      email: null,
      fullName: 'Orxan Məmmədli',
      locale: 'az',
      role: UserRole.CUSTOMER,
      isActive: true,
      createdAt,
      profile: {
        userId: CUSTOMER_IDS.orxan,
        customerType: CustomerType.INDIVIDUAL,
        companyName: null,
        taxId: null,
      },
    },
    {
      id: CUSTOMER_IDS.tikintiMmc,
      phone: '+994500000002',
      email: 'office@tikinti.example',
      fullName: 'Aysel Hüseynova',
      locale: 'az',
      role: UserRole.CUSTOMER,
      isActive: true,
      createdAt,
      profile: {
        userId: CUSTOMER_IDS.tikintiMmc,
        customerType: CustomerType.COMPANY,
        companyName: 'Tikinti MMC',
        taxId: '0000000000',
      },
    },
  ];
}

export function createStaffUsers(now: Date): User[] {
  const createdAt = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  return Object.values(STAFF).map((staff) => ({
    id: staff.id,
    phone: '+994506209584',
    email: staff.email,
    fullName: staff.fullName,
    locale: 'az',
    role: staff.role,
    isActive: true,
    createdAt,
  }));
}

/** Sites inside Baku/Absheron. TODO(nurlan): placeholder addresses and coordinates. */
export function createSites(now: Date): Site[] {
  const createdAt = new Date(now.getTime() - 40 * 86_400_000).toISOString();
  return [
    {
      id: SITE_IDS.yasamal,
      customerId: CUSTOMER_IDS.orxan,
      name: 'Yasamal, ev tikintisi',
      addressLine: 'Yasamal rayonu, Əhməd Rəcəbli küç. 12',
      location: { lat: 40.3905, lng: 49.811 },
      accessNotes: 'Dar küçə, mikser üçün giriş həyətin arxa tərəfindən.',
      contactName: 'Orxan',
      contactPhone: '+994500000001',
      isDefault: true,
      createdAt,
    },
    {
      id: SITE_IDS.xirdalan,
      customerId: CUSTOMER_IDS.orxan,
      name: 'Xırdalan, qaraj',
      addressLine: 'Xırdalan şəhəri, Heydər Əliyev pr. 45',
      location: { lat: 40.448, lng: 49.755 },
      accessNotes: null,
      contactName: 'Usta Vüqar',
      contactPhone: '+994500000021',
      isDefault: false,
      createdAt,
    },
    {
      id: SITE_IDS.mardakan,
      customerId: CUSTOMER_IDS.orxan,
      name: 'Mərdəkan bağ evi',
      addressLine: 'Mərdəkan qəs., Bağlar küç. 7',
      location: { lat: 40.492, lng: 50.142 },
      accessNotes: 'Darvazanı zəng edib açdırın.',
      contactName: null,
      contactPhone: null,
      isDefault: false,
      createdAt,
    },
    {
      id: SITE_IDS.binagadi,
      customerId: CUSTOMER_IDS.tikintiMmc,
      name: 'Binəqədi, yaşayış kompleksi',
      addressLine: 'Binəqədi rayonu, Sülh küç. 3',
      location: { lat: 40.465, lng: 49.829 },
      accessNotes: 'Obyekt rəhbəri ilə əvvəlcədən razılaşdırın.',
      contactName: 'Aysel Hüseynova',
      contactPhone: '+994500000002',
      isDefault: true,
      createdAt,
    },
  ];
}
