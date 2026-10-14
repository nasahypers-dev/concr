import {
  BarChart3,
  CalendarRange,
  ClipboardList,
  Inbox,
  type LucideIcon,
  MapPin,
  Settings,
} from 'lucide-react';

export type NavKey = 'inbox' | 'orders' | 'board' | 'live' | 'settings' | 'reports';

export interface NavItem {
  key: NavKey;
  href: string;
  icon: LucideIcon;
}

/** Spec §14 areas in sidebar order; labels come from `panel.nav.*`. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'inbox', href: '/inbox', icon: Inbox },
  { key: 'orders', href: '/orders', icon: ClipboardList },
  { key: 'board', href: '/board', icon: CalendarRange },
  { key: 'live', href: '/live', icon: MapPin },
  { key: 'settings', href: '/settings', icon: Settings },
  { key: 'reports', href: '/reports', icon: BarChart3 },
];

export function activeNav(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
