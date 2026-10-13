/**
 * Administrative units ("Sabunçu rayonu", "Сабунчинский район", "Sabunchu District") confuse
 * customers who think in settlements; addresses name the specific place instead (owner, 2026-10-13).
 * Checked word by word: JavaScript's `\b` is ASCII-only and would miss the Cyrillic "район".
 */
const ADMINISTRATIVE_WORD = /^(rayonu?|район|district)$/iu;
const NON_WORD = /[^\p{L}\p{N}]+/u;

export function isAdministrativeArea(name: string): boolean {
  return name.split(NON_WORD).some((word) => ADMINISTRATIVE_WORD.test(word));
}

/** First non-empty candidate that is not an administrative unit. */
export function pickLocality(candidates: (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    const name = (candidate ?? '').trim();
    if (name !== '' && !isAdministrativeArea(name)) return name;
  }
  return '';
}

/** Trimmed, non-empty, case-insensitively unique parts in order. */
export function dedupeParts(parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    const key = part.toLowerCase();
    if (part === '' || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}
