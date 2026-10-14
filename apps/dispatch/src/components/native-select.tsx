import { cn } from 'cn';
import type { ComponentProps } from 'react';

/**
 * A styled native `<select>`: keyboard-friendly, works in every browser and in jsdom tests. The
 * panel uses it for every form choice (mixers, drivers, types); the Base UI Select stays for menus.
 */
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
