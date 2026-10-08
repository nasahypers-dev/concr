/** Joins NativeWind class names, dropping falsy entries (no runtime dependency needed). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
