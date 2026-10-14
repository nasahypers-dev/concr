import type { ReactNode } from 'react';
import { PanelShell } from '@/features/shell/panel-shell';

/** Every page under (panel) sits behind the staff session guard and the sidebar + top bar. */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
